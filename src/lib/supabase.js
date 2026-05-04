import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are set and valid
const isValidConfig = supabaseUrl && supabaseAnonKey &&
  !supabaseUrl.includes('your_supabase') &&
  !supabaseAnonKey.includes('your_supabase')

if (!isValidConfig) {
  console.warn('Supabase not configured. Auth features will be disabled.')
}

// Create a mock client for development if config is missing
const createMockClient = () => {
  const chain = {
    eq: () => chain,
    gte: () => chain,
    lte: () => chain,
    ilike: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null }),
    select: () => chain,
    insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
    update: () => chain,
    delete: () => chain,
    upsert: () => chain,
    rpc: async () => ({ data: null, error: null }),
  };
  return {
    auth: {
      signUp: async () => ({ error: { message: 'Supabase not configured' } }),
      signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      resend: async () => ({ error: { message: 'Supabase not configured' } }),
      updateUser: async () => ({ error: { message: 'Supabase not configured' } }),
    },
    from: () => chain,
    rpc: async () => ({ data: null, error: null }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => ({ data: null, error: null }),
      }),
    },
  }
}

// Create Supabase client with proper headers to avoid 406 errors
const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
  });
};

export const supabase = isValidConfig ? createSupabaseClient() : createMockClient()

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

// Helper function to get current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  return session
}
