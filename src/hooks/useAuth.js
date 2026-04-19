import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useRateLimit } from './useRateLimit';

// Validation helper functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  if (password.length >= 8) {
    // Only enforce additional rules for 8+ char passwords
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }
  return errors;
};

const validateBusinessName = (name) => {
  if (!name || name.trim().length < 2) {
    return 'Business name must be at least 2 characters';
  }
  if (name.length > 100) {
    return 'Business name must be less than 100 characters';
  }
  return null;
};

// Sanitize error messages for user display
const sanitizeError = (error) => {
  if (!error) return 'An unexpected error occurred';

  const message = error.message || error;

  // Map known Supabase errors to user-friendly messages
  const errorMap = {
    'Invalid login credentials': 'Invalid email or password. Please try again.',
    'Email not confirmed': 'Please confirm your email address before signing in.',
    'User already registered': 'An account with this email already exists.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
    'Unable to validate email address: invalid format': 'Please enter a valid email address.',
    'Auth session missing!': 'Your session has expired. Please sign in again.',
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) {
      return value;
    }
  }

  // Generic fallback - don't expose internal details
  if (message.includes('database') || message.includes('sql') || message.includes('constraint')) {
    return 'A server error occurred. Please try again later.';
  }

  return message;
};

export function useAuth() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rate limiting for sign in (5 attempts per minute)
  const {
    isRateLimited: isSignInRateLimited,
    remainingTime: signInRemainingTime,
    checkRateLimit: checkSignInRateLimit,
    recordAttempt: recordSignInAttempt
  } = useRateLimit(5, 60000);

  // Fetch business profile for current user with improved retry logic
  const fetchBusiness = useCallback(async (userId, maxRetries = 5) => {
    if (!userId) return null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          // PGRST116 = no rows returned, which is OK for new users
          if (error.code === 'PGRST116') {
            return null;
          }
          console.error('Error fetching business:', error);
          return null;
        }

        if (data) {
          return data;
        }

        // No data yet, wait and retry with exponential backoff
        if (attempt < maxRetries) {
          const delay = 300 * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (err) {
        console.error('Error fetching business:', err);
        return null;
      }
    }

    console.warn('Business record not found after retries');
    return null;
  }, []);

  // Refresh session on expiry
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (!session) {
        // Try to refresh
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw refreshError;
        return refreshData.session;
      }

      return session;
    } catch (err) {
      console.error('Session refresh error:', err);
      setUser(null);
      setBusiness(null);
      return null;
    }
  }, []);

  // Create business profile manually (fallback if trigger fails)
  const createBusinessProfile = useCallback(async (userId, businessName) => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert([
          {
            user_id: userId,
            business_name: businessName.trim(),
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Failed to create business profile:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Exception creating business profile:', err);
      return null;
    }
  }, []);

  // Sign up with email/password - new multi-type registration
  const signUp = useCallback(async (registrationData) => {
    const {
      email,
      password,
      fullName,
      userType,
      // Organiser fields
      businessName,
      businessType,
      businessLocation,
      website,
      // Corporate fields
      companyName,
      industry,
      companySize,
    } = registrationData;

    setError(null);

    try {
      // Create auth user with extended metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
            // Include all fields for the trigger or profile creation
            ...(userType === 'organiser' && {
              business_name: businessName,
              business_type: businessType,
              business_location: businessLocation,
              website: website,
            }),
            ...(userType === 'corporate' && {
              company_name: companyName,
              industry: industry,
              company_size: companySize,
            }),
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // For organisers, fetch/create business record
        let businessData = null;
        if (userType === 'organiser') {
          businessData = await fetchBusiness(authData.user.id);

          if (!businessData && businessName) {
            businessData = await createBusinessProfile(authData.user.id, businessName);
          }
        }

        // Store user type in session for routing decisions
        setUser({
          ...authData.user,
          user_type: userType,
        });
        setBusiness(businessData);
        return { success: true, error: null, userType };
      }
    } catch (err) {
      const sanitized = sanitizeError(err);
      setError(sanitized);
      return { success: false, error: sanitized };
    }
  }, [fetchBusiness, createBusinessProfile]);

  // Sign in with email/password
  const signIn = useCallback(async (email, password) => {
    setError(null);

    // Check rate limiting
    if (isSignInRateLimited) {
      const errorMsg = `Too many sign in attempts. Please try again in ${signInRemainingTime} seconds.`;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Basic validation
    if (!email || !email.trim()) {
      const errorMsg = 'Please enter your email address';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!password) {
      const errorMsg = 'Please enter your password';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Record the attempt
    recordSignInAttempt();

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Wait for session to propagate before fetching business
        await new Promise(resolve => setTimeout(resolve, 100));

        let businessData = await fetchBusiness(authData.user.id);

        // If no business record exists, try to create one from user metadata
        if (!businessData && authData.user.user_metadata?.business_name) {
          businessData = await createBusinessProfile(
            authData.user.id,
            authData.user.user_metadata.business_name
          );
        }

        setUser(authData.user);
        setBusiness(businessData);
        return { success: true, error: null };
      }
    } catch (err) {
      const sanitized = sanitizeError(err);
      setError(sanitized);
      return { success: false, error: sanitized };
    }
  }, [fetchBusiness, isSignInRateLimited, signInRemainingTime, recordSignInAttempt, createBusinessProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setBusiness(null);
      return { success: true, error: null };
    } catch (err) {
      const sanitized = sanitizeError(err);
      setError(sanitized);
      return { success: false, error: sanitized };
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const session = await refreshSession();

        if (session?.user) {
          setUser(session.user);
          const businessData = await fetchBusiness(session.user.id);
          setBusiness(businessData);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          // Small delay for trigger to complete
          await new Promise(resolve => setTimeout(resolve, 100));
          let businessData = await fetchBusiness(session.user.id);

          // Fallback: create business if missing and we have metadata
          if (!businessData && session.user.user_metadata?.business_name) {
            businessData = await createBusinessProfile(
              session.user.id,
              session.user.user_metadata.business_name
            );
          }

          setBusiness(businessData);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setBusiness(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchBusiness, refreshSession, createBusinessProfile]);

  // Update business data (e.g., after creating an event)
  const refreshBusiness = useCallback(async () => {
    if (user?.id) {
      let businessData = await fetchBusiness(user.id);

      // Fallback: create business if missing
      if (!businessData && user.user_metadata?.business_name) {
        businessData = await createBusinessProfile(
          user.id,
          user.user_metadata.business_name
        );
      }

      setBusiness(businessData);
    }
  }, [user, fetchBusiness, createBusinessProfile]);

  return {
    user,
    business,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    refreshBusiness,
    refreshSession,
    createBusinessProfile,
    clearError: () => setError(null),
    isAuthenticated: !!user,
  };
}
