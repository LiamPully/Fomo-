import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useRateLimit } from './useRateLimit';
import { safeLog } from '../lib/security';

// Validation helper functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (password && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (password && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (password && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
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

// Sanitize error messages for user display — prevent user enumeration
const sanitizeError = (error) => {
  if (!error) return 'An unexpected error occurred';

  const message = error.message || error;

  // Neutralize auth errors to prevent account enumeration
  if (message.includes('Invalid login credentials')) {
    return 'Invalid credentials. Please try again.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Invalid credentials. Please try again.';
  }
  if (message.includes('User already registered')) {
    return 'If this email is not registered, a confirmation email has been sent.';
  }

  // Map remaining known Supabase errors to user-friendly messages
  const errorMap = {
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

  // Rate limiting for sign up (3 attempts per minute)
  const {
    isRateLimited: isSignUpRateLimited,
    remainingTime: signUpRemainingTime,
    checkRateLimit: checkSignUpRateLimit,
    recordAttempt: recordSignUpAttempt
  } = useRateLimit(3, 60000);

  // Rate limiting for password reset (3 attempts per 5 minutes)
  const {
    isRateLimited: isResetRateLimited,
    remainingTime: resetRemainingTime,
    checkRateLimit: checkResetRateLimit,
    recordAttempt: recordResetAttempt
  } = useRateLimit(3, 300000);

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
          safeLog.error('Error fetching business:', error);
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
        safeLog.error('Error fetching business:', err);
        return null;
      }
    }

    safeLog.warn('Business record not found after retries');
    return null;
  }, []);

  // Refresh session on expiry
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (err) {
      safeLog.error('Session refresh error:', err);
      setUser(null);
      setBusiness(null);
      return null;
    }
  }, []);

  // Send password reset email
  const sendPasswordReset = useCallback(async (email) => {
    setError(null);

    // Check rate limiting
    const canProceed = checkResetRateLimit();
    if (!canProceed || isResetRateLimited) {
      const errorMsg = `Too many password reset attempts. Please try again in ${resetRemainingTime} seconds.`;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    recordResetAttempt();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      return { success: true, error: null };
    } catch (err) {
      const sanitized = sanitizeError(err);
      setError(sanitized);
      return { success: false, error: sanitized };
    }
  }, [isResetRateLimited, resetRemainingTime, recordResetAttempt, checkResetRateLimit]);

  // Create business profile manually (fallback if trigger fails)
  const createBusinessProfile = useCallback(async (userId, businessName, userEmail = '') => {
    try {
      const name = businessName?.trim();
      if (!name || name.length < 2) {
        safeLog.warn('Skipping business creation: invalid business name');
        return null;
      }
      const { data, error } = await supabase
        .from('businesses')
        .insert([
          {
            user_id: userId,
            business_name: name,
            email: userEmail || '',
          }
        ])
        .select()
        .single();

      if (error) {
        safeLog.error('Failed to create business profile:', error);
        return null;
      }
      return data;
    } catch (err) {
      safeLog.error('Exception creating business profile:', err);
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

    // Check rate limiting
    const canProceed = checkSignUpRateLimit();
    if (!canProceed || isSignUpRateLimited) {
      const errorMsg = `Too many sign up attempts. Please try again in ${signUpRemainingTime} seconds.`;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Validate password strength before sending to Supabase
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      const errorMsg = passwordErrors.join('. ');
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Record sign-up attempt
    recordSignUpAttempt();

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
            businessData = await createBusinessProfile(authData.user.id, businessName, authData.user.email);
          }
        }

        // Store user type in session for routing decisions
        // Add computed firstName from full_name or email
        const enhancedUser = {
          ...authData.user,
          user_type: userType,
          firstName: authData.user.user_metadata?.full_name?.split(' ')[0]
            || authData.user.email?.split('@')[0]
            || 'User'
        };
        setUser(enhancedUser);
        setBusiness(businessData);
        return { success: true, error: null, userType };
      }
    } catch (err) {
      const sanitized = sanitizeError(err);
      setError(sanitized);
      return { success: false, error: sanitized };
    }
  }, [fetchBusiness, createBusinessProfile, isSignUpRateLimited, signUpRemainingTime, recordSignUpAttempt, checkSignUpRateLimit]);

  // Sign in with email/password
  const signIn = useCallback(async (email, password, keepSignedIn = false) => {
    setError(null);

    // Check rate limiting
    const canProceed = checkSignInRateLimit();
    if (!canProceed || isSignInRateLimited) {
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

      // Handle session persistence preference
      if (!keepSignedIn) {
        try {
          sessionStorage.setItem('fomoza_session_only', 'true');
          sessionStorage.setItem('fomoza_tab_active', 'true');
        } catch {
          // ignore
        }
      } else {
        try {
          sessionStorage.removeItem('fomoza_session_only');
          sessionStorage.removeItem('fomoza_tab_active');
        } catch {
          // ignore
        }
      }

      if (authData.user && authData.session) {
        let businessData = await fetchBusiness(authData.user.id);

        // If no business record exists, try to create one from user metadata
        if (!businessData && authData.user.user_metadata?.business_name) {
          businessData = await createBusinessProfile(
            authData.user.id,
            authData.user.user_metadata.business_name,
            authData.user.email
          );
        }

        // Add computed firstName to user object
        const enhancedUser = {
          ...authData.user,
          firstName: authData.user.user_metadata?.full_name?.split(' ')[0]
            || authData.user.email?.split('@')[0]
            || 'User'
        };
        setUser(enhancedUser);
        setBusiness(businessData);
        return { success: true, error: null, keepSignedIn };
      }
    } catch (err) {
      const sanitized = sanitizeError(err);
      setError(sanitized);
      return { success: false, error: sanitized };
    }
  }, [fetchBusiness, isSignInRateLimited, signInRemainingTime, recordSignInAttempt, createBusinessProfile, checkSignInRateLimit]);

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
    // Remove legacy custom auth storage keys (migrated to Supabase secure storage)
    try {
      localStorage.removeItem('fomoza_auth_persistent');
      sessionStorage.removeItem('fomoza_auth_session');
    } catch {
      // ignore storage errors
    }

    // Session-only mode: if user chose "don't keep me signed in" and this is a new tab, sign out
    try {
      const sessionOnly = sessionStorage.getItem('fomoza_session_only');
      const tabActive = sessionStorage.getItem('fomoza_tab_active');
      if (sessionOnly === 'true' && tabActive !== 'true') {
        supabase.auth.signOut().then(() => {
          sessionStorage.removeItem('fomoza_session_only');
        });
      }
      // Mark this tab as active
      sessionStorage.setItem('fomoza_tab_active', 'true');
    } catch {
      // ignore
    }

    // On page unload, remove the active tab marker (but keep session_only flag)
    const handleBeforeUnload = () => {
      try {
        sessionStorage.removeItem('fomoza_tab_active');
      } catch {
        // ignore
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session?.user) {
          setUser(session.user);
          const businessData = await fetchBusiness(session.user.id);
          setBusiness(businessData);
        }
      } catch (err) {
        safeLog.error('Session check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const enhancedUser = {
            ...session.user,
            firstName: session.user.user_metadata?.full_name?.split(' ')[0]
              || session.user.email?.split('@')[0]
              || 'User'
          };
          setUser(enhancedUser);
          await new Promise(resolve => setTimeout(resolve, 100));
          let businessData = await fetchBusiness(session.user.id);

          if (!businessData && session.user.user_metadata?.business_name) {
            businessData = await createBusinessProfile(
              session.user.id,
              session.user.user_metadata.business_name,
              session.user.email
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
      window.removeEventListener('beforeunload', handleBeforeUnload);
      subscription.unsubscribe();
    };
  }, [fetchBusiness, createBusinessProfile]);

  // Update business data (e.g., after creating an event)
  const refreshBusiness = useCallback(async () => {
    if (user?.id) {
      let businessData = await fetchBusiness(user.id);

      // Fallback: create business if missing
      if (!businessData && user.user_metadata?.business_name) {
        businessData = await createBusinessProfile(
          user.id,
          user.user_metadata.business_name,
          user.email
        );
      }

      setBusiness(businessData);
    }
  }, [user, fetchBusiness, createBusinessProfile]);

  // Refresh user metadata from Supabase (e.g., after profile edit)
  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: refreshedUser }, error } = await supabase.auth.getUser();
      if (!error && refreshedUser) {
        const enhancedUser = {
          ...refreshedUser,
          firstName: refreshedUser.user_metadata?.full_name?.split(' ')[0]
            || refreshedUser.email?.split('@')[0]
            || 'User'
        };
        setUser(enhancedUser);
      }
    } catch (err) {
      safeLog.error('Refresh user error:', err);
    }
  }, []);

  // Delete account — removes all user data from public tables and signs out
  const deleteAccount = useCallback(async () => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    try {
      // Delete user's events
      await supabase.from('events').delete().eq('user_id', user.id);
      // Delete saved events
      await supabase.from('saved_events').delete().eq('user_id', user.id);
      // Delete business record
      await supabase.from('businesses').delete().eq('user_id', user.id);
      // Delete profile
      await supabase.from('profiles').delete().eq('user_id', user.id);
      // Sign out (auth user deletion requires admin/service role — not possible client-side)
      await supabase.auth.signOut();
      setUser(null);
      setBusiness(null);
      return { success: true, error: null };
    } catch (err) {
      safeLog.error('Delete account error:', err);
      return { success: false, error: 'Failed to delete account. Please try again.' };
    }
  }, [user]);

  return {
    user,
    business,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    refreshBusiness,
    refreshUser,
    refreshSession,
    createBusinessProfile,
    deleteAccount,
    clearError: () => setError(null),
    isAuthenticated: !!user,
  };
}
