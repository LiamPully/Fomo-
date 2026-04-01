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

const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return 'Name is required';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  if (name.length > 100) {
    return 'Name must be less than 100 characters';
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
    'Email not confirmed': 'Please check your email to confirm your account before signing in.',
    'User already registered': 'An account with this email already exists. Please sign in instead.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
    'Unable to validate email address: invalid format': 'Please enter a valid email address.',
    'Auth session missing!': 'Your session has expired. Please sign in again.',
    'Database error saving new user': 'Account creation failed. Please try again.',
    'Failed to create profile': 'Account created but profile setup failed. Please contact support.',
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

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('Failed to fetch')) {
    return 'Network error. Please check your internet connection.';
  }

  return message;
};

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
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

  // Fetch profile for current user with retry logic
  const fetchProfile = useCallback(async (userId, attempt = 1) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // PGRST116 = no rows returned (profile not created yet by trigger)
        if (error.code === 'PGRST116') {
          if (attempt < 3) {
            // Retry after delay to allow trigger to run
            await new Promise(r => setTimeout(r, 500 * attempt));
            return fetchProfile(userId, attempt + 1);
          }
          return null;
        }
        console.error('Error fetching profile:', error);
        return { error: 'Failed to load profile. Please refresh to try again.' };
      }

      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return { error: 'Network error loading profile. Please check your connection.' };
    }
  }, []);

  // Fetch business profile for current user with retry
  const fetchBusiness = useCallback(async (userId, attempt = 1) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 500 * attempt));
            return fetchBusiness(userId, attempt + 1);
          }
          return null;
        }
        console.error('Error fetching business:', error);
        return { error: 'Failed to load business profile.' };
      }

      return data;
    } catch (err) {
      console.error('Error fetching business:', err);
      return { error: 'Network error loading business profile.' };
    }
  }, []);

  // Get user role from profile or metadata
  const getUserRole = useCallback((userData, profileData) => {
    // First check profile (source of truth)
    if (profileData?.role) return profileData.role;
    // Fallback to metadata
    return userData?.user_metadata?.role || userData?.user_metadata?.user_type || null;
  }, []);

  // Sign up with email/password
  const signUp = useCallback(async (email, password, name, userType = 'customer') => {
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

    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      return { success: false, error: nameError };
    }

    try {
      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
            role: userType,
          },
        },
      });

      if (authError) {
        console.error('Signup error:', authError);
        throw authError;
      }

      if (authData.user) {
        // Fetch the created profile with retry (trigger creates it)
        const profileData = await fetchProfile(authData.user.id);
        const businessData = userType === 'business' ? await fetchBusiness(authData.user.id) : null;

        // Check for profile fetch errors
        if (profileData?.error) {
          console.warn('Profile fetch warning:', profileData.error);
          // Don't fail - user is created, profile might sync eventually
        }
        if (businessData?.error) {
          console.warn('Business fetch warning:', businessData.error);
        }

        // Set user with role
        authData.user.role = userType;
        setUser(authData.user);
        setProfile(profileData?.error ? null : profileData);
        setBusiness(businessData?.error ? null : businessData);

        return { success: true, error: null, role: userType, profileWarning: profileData?.error };
      }

      return { success: false, error: 'Account creation failed. Please try again.' };
    } catch (err) {
      console.error('Signup catch error:', err);
      const sanitized = sanitizeError(err);
      setError(sanitized);
      return { success: false, error: sanitized };
    }
  }, [fetchProfile, fetchBusiness]);

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

      if (authError) {
        console.error('Signin error:', authError);
        throw authError;
      }

      if (authData.user) {
        // Fetch profile and business data
        const profileData = await fetchProfile(authData.user.id);
        const userRole = getUserRole(authData.user, profileData?.error ? null : profileData) || 'customer';
        const businessData = userRole === 'business' ? await fetchBusiness(authData.user.id) : null;

        authData.user.role = userRole;
        setUser(authData.user);
        setProfile(profileData?.error ? null : profileData);
        setBusiness(businessData?.error ? null : businessData);

        // Show warning if profile couldn't load
        if (profileData?.error) {
          console.warn('Profile load warning:', profileData.error);
        }

        return { success: true, error: null, role: userRole, profileWarning: profileData?.error };
      }

      return { success: false, error: 'Sign in failed. Please try again.' };
    } catch (err) {
      console.error('Signin catch error:', err);
      const sanitized = sanitizeError(err);
      setError(sanitized);
      return { success: false, error: sanitized };
    }
  }, [fetchProfile, fetchBusiness, getUserRole, isSignInRateLimited, signInRemainingTime, recordSignInAttempt]);

  // Sign out
  const signOut = useCallback(async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
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
    let mounted = true;

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user && mounted) {
          const profileData = await fetchProfile(session.user.id);
          const userRole = getUserRole(session.user, profileData?.error ? null : profileData) || 'customer';
          const businessData = userRole === 'business' ? await fetchBusiness(session.user.id) : null;

          session.user.role = userRole;
          setUser(session.user);
          setProfile(profileData?.error ? null : profileData);
          setBusiness(businessData?.error ? null : businessData);
          if (profileData?.error) console.warn('Session profile load warning:', profileData.error);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && mounted) {
          const profileData = await fetchProfile(session.user.id);
          const userRole = getUserRole(session.user, profileData?.error ? null : profileData) || 'customer';
          const businessData = userRole === 'business' ? await fetchBusiness(session.user.id) : null;

          session.user.role = userRole;
          setUser(session.user);
          setProfile(profileData?.error ? null : profileData);
          setBusiness(businessData?.error ? null : businessData);
          if (profileData?.error) console.warn('Auth state profile load warning:', profileData.error);
        } else if (event === 'SIGNED_OUT' && mounted) {
          setUser(null);
          setProfile(null);
          setBusiness(null);
        }
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchBusiness, getUserRole]);

  // Update user role (switch between customer and business)
  const updateRole = useCallback(async (newRole) => {
    setError(null);

    if (!['customer', 'business'].includes(newRole)) {
      const errorMsg = 'Invalid role. Must be customer or business';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update auth user metadata
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: { role: newRole }
      });

      if (updateError) throw updateError;

      // Refresh data
      if (data.user) {
        const profileData = await fetchProfile(user.id);
        const businessData = newRole === 'business' ? await fetchBusiness(user.id) : null;

        data.user.role = newRole;
        setUser(data.user);
        setProfile(profileData);
        setBusiness(businessData);

        return { success: true, error: null, role: newRole };
      }
    } catch (err) {
      const sanitized = sanitizeError(err);
      setError(sanitized);
      return { success: false, error: sanitized };
    }
  }, [user, fetchProfile, fetchBusiness]);

  // Update profile
  const updateProfile = useCallback(async (updates) => {
    setError(null);
    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { success: true, error: null, data };
    } catch (err) {
      const sanitized = sanitizeError(err);
      setError(sanitized);
      return { success: false, error: sanitized };
    }
  }, [user]);

  // Refresh profile (for retry after load failure)
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    setLoading(true);
    const profileData = await fetchProfile(user.id);
    const businessData = await fetchBusiness(user.id);
    setProfile(profileData?.error ? null : profileData);
    setBusiness(businessData?.error ? null : businessData);
    setLoading(false);
    return {
      success: !profileData?.error,
      error: profileData?.error || null,
      profile: profileData?.error ? null : profileData
    };
  }, [user, fetchProfile, fetchBusiness]);

  return {
    user,
    profile,
    business,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateRole,
    updateProfile,
    refreshProfile,
    isAuthenticated: !!user,
    role: profile?.role || user?.role || null,
    hasRole: !!(profile?.role || user?.user_metadata?.role),
  };
}
