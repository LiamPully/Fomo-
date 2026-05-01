import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useRateLimit } from './useRateLimit';
import { safeLog } from '../lib/security';

// Storage keys
const AUTH_STORAGE_KEY = 'fomoza_auth_session';
const AUTH_PERSISTENT_KEY = 'fomoza_auth_persistent';
// Storage helpers
const storage = {
  local: {
    get: (key) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    },
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error('localStorage set error:', e);
      }
    },
    remove: (key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('localStorage remove error:', e);
      }
    },
  },
  session: {
    get: (key) => {
      try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    },
    set: (key, value) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error('sessionStorage set error:', e);
      }
    },
    remove: (key) => {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        console.error('sessionStorage remove error:', e);
      }
    },
  },
};

// Save session to storage
const saveSession = (session, keepSignedIn) => {
  if (!session) return;

  // Clear opposing storage first to prevent stale sessions
  clearAllAuthStorage();

  const expiresAtMs = session.expires_at
    ? session.expires_at * 1000
    : Date.now() + 3600 * 1000;

  const sessionData = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: expiresAtMs,
    user: session.user,
  };

  if (keepSignedIn) {
    storage.local.set(AUTH_PERSISTENT_KEY, sessionData);
  } else {
    storage.session.set(AUTH_STORAGE_KEY, sessionData);
  }
};

// Clear all auth storage
const clearAllAuthStorage = () => {
  storage.local.remove(AUTH_PERSISTENT_KEY);
  storage.session.remove(AUTH_STORAGE_KEY);
};

// Get stored session
const getStoredSession = () => {
  // Check localStorage first (persistent)
  const persistentSession = storage.local.get(AUTH_PERSISTENT_KEY);
  if (persistentSession) {
    // Check if expired
    if (Date.now() > persistentSession.expires_at) {
      storage.local.remove(AUTH_PERSISTENT_KEY);
      return null;
    }
    return { ...persistentSession, isPersistent: true };
  }

  // Check sessionStorage (session only)
  const sessionData = storage.session.get(AUTH_STORAGE_KEY);
  if (sessionData) {
    // Check if expired
    if (Date.now() > sessionData.expires_at) {
      storage.session.remove(AUTH_STORAGE_KEY);
      return null;
    }
    return { ...sessionData, isPersistent: false };
  }

  return null;
};

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

      if (!session) {
        // Try to refresh
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw refreshError;
        return refreshData.session;
      }

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
    if (isResetRateLimited) {
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
  }, [isResetRateLimited, resetRemainingTime, recordResetAttempt]);

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

    // Check rate limiting for sign up
    if (isSignUpRateLimited) {
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
            businessData = await createBusinessProfile(authData.user.id, businessName);
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
  }, [fetchBusiness, createBusinessProfile, isSignUpRateLimited, signUpRemainingTime, recordSignUpAttempt]);

  // Sign in with email/password
  const signIn = useCallback(async (email, password, keepSignedIn = false) => {
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

      if (authData.user && authData.session) {
        // Save session based on "Keep me signed in" preference
        saveSession(authData.session, keepSignedIn);

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
  }, [fetchBusiness, isSignInRateLimited, signInRemainingTime, recordSignInAttempt, createBusinessProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear all auth storage on logout
      clearAllAuthStorage();

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
    // Check for existing session from storage or Supabase
    const checkSession = async () => {
      try {
        // First check localStorage/sessionStorage
        const storedSession = getStoredSession();

        if (storedSession) {
          // Restore the session to Supabase
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: storedSession.access_token,
            refresh_token: storedSession.refresh_token,
          });

          if (!error && session?.user) {
            setUser(session.user);
            const businessData = await fetchBusiness(session.user.id);
            setBusiness(businessData);
            setLoading(false);
            return;
          }
        }

        // Fallback: check Supabase native session
        const session = await refreshSession();

        if (session?.user) {
          setUser(session.user);
          const businessData = await fetchBusiness(session.user.id);
          setBusiness(businessData);
        }
      } catch (err) {
        safeLog.error('Session check error:', err);
        // Clear invalid stored sessions
        clearAllAuthStorage();
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Periodic session validation every 5 minutes
    const validationInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          const stored = getStoredSession();
          if (stored) {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !refreshData.session) {
              clearAllAuthStorage();
              setUser(null);
              setBusiness(null);
            }
          }
        }
      } catch (err) {
        safeLog.error('Periodic session validation error:', err);
      }
    }, 5 * 60 * 1000);

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Add computed firstName to user object
          const enhancedUser = {
            ...session.user,
            firstName: session.user.user_metadata?.full_name?.split(' ')[0]
              || session.user.email?.split('@')[0]
              || 'User'
          };
          setUser(enhancedUser);
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
          clearAllAuthStorage();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
          // Update stored session with new tokens
          const stored = getStoredSession();
          if (stored) {
            saveSession(session, stored.isPersistent);
          }
        }
        setLoading(false);
      }
    );

    return () => {
      clearInterval(validationInterval);
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
    sendPasswordReset,
    refreshBusiness,
    refreshSession,
    createBusinessProfile,
    clearError: () => setError(null),
    isAuthenticated: !!user,
  };
}
