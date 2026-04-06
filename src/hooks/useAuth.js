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
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
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

  // Fetch business profile for current user with retry logic
  const fetchBusiness = useCallback(async (userId, attempt = 1) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // PGRST116 = no rows returned (business not created yet by trigger)
        if (error.code === 'PGRST116') {
          if (attempt < 5) {
            // Exponential backoff: 300ms, 600ms, 1200ms, 2400ms
            await new Promise(resolve => setTimeout(resolve, 300 * attempt));
            return fetchBusiness(userId, attempt + 1);
          }
          console.warn('Business record not found after retries');
          return null;
        }
        console.error('Error fetching business:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error fetching business:', err);
      return null;
    }
  }, []);

  // Sign up with email/password
  const signUp = useCallback(async (email, password, businessName) => {
    setError(null);

    // Validate inputs
    if (!validateEmail(email)) {
      const errorMsg = 'Please enter a valid email address';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      const errorMsg = passwordErrors.join('. ');
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    const businessNameError = validateBusinessName(businessName);
    if (businessNameError) {
      setError(businessNameError);
      return { success: false, error: businessNameError };
    }

    try {
      // Create auth user with business name in metadata for trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName.trim(),
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Note: Business record is now auto-created by database trigger
        // But we still fetch it to update local state
        const businessData = await fetchBusiness(authData.user.id);

        setUser(authData.user);
        setBusiness(businessData);
        return { success: true, error: null };
      }
    } catch (err) {
      const sanitized = sanitizeError(err);
      setError(sanitized);
      return { success: false, error: sanitized };
    }
  }, [fetchBusiness]);

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
        const businessData = await fetchBusiness(authData.user.id);
        setUser(authData.user);
        setBusiness(businessData);
        return { success: true, error: null };
      }
    } catch (err) {
      const sanitized = sanitizeError(err);
      setError(sanitized);
      return { success: false, error: sanitized };
    }
  }, [fetchBusiness, isSignInRateLimited, signInRemainingTime, recordSignInAttempt]);

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
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

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
          const businessData = await fetchBusiness(session.user.id);
          setBusiness(businessData);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setBusiness(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchBusiness]);

  // Update business data (e.g., after creating an event)
  const refreshBusiness = useCallback(async () => {
    if (user?.id) {
      const businessData = await fetchBusiness(user.id);
      setBusiness(businessData);
    }
  }, [user, fetchBusiness]);

  return {
    user,
    business,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    refreshBusiness,
    clearError: () => setError(null),
    isAuthenticated: !!user,
  };
}
