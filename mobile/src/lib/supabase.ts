import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PUBLIC_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLIC_ANON || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please add SUPABASE_PUBLIC_URL and SUPABASE_PUBLIC_ANON to your environment variables.');
}

/**
 * Custom storage adapter that validates session data before returning it.
 * If the stored session's refresh_token is missing or the session is expired,
 * we wipe it so Supabase never attempts a doomed token refresh (which would
 * throw an unhandled AuthApiError on startup).
 */
const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) return null;

      // Validate session data before handing it to Supabase
      try {
        const parsed = JSON.parse(value);
        // Supabase stores the session under the key that ends with 'auth-token'
        if (key.includes('auth-token') && parsed) {
          const session = parsed.currentSession || parsed;
          const hasRefreshToken = !!session?.refresh_token;
          const expiresAt = session?.expires_at;
          const isExpired = expiresAt ? expiresAt * 1000 < Date.now() : false;

          if (!hasRefreshToken || isExpired) {
            console.log('Supabase: clearing stale/expired session from storage');
            await AsyncStorage.removeItem(key);
            return null;
          }
        }
      } catch {
        // JSON parse failed — not a session object, pass through as-is
      }

      return value;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // Ignore storage errors
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Handle auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Auth token refreshed');
  } else if (event === 'SIGNED_OUT') {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const supabaseKeys = keys.filter(key => key.startsWith('sb-') || key.startsWith('supabase'));
      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys);
      }
    } catch {
      // Ignore
    }
  }
});

/**
 * Clear invalid auth session when refresh token errors occur
 */
export async function clearInvalidSession(): Promise<void> {
  try {
    await supabase.auth.signOut();
    // Also clear any cached auth data
    const keys = await AsyncStorage.getAllKeys();
    const supabaseKeys = keys.filter(key => key.startsWith('sb-') || key.startsWith('supabase'));
    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
    }
  } catch (e) {
    // Ignore errors during cleanup
    console.warn('Error clearing invalid session:', e);
  }
}

/**
 * Helper to add timeout to promises
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Network request timed out')), ms)
  );
  return Promise.race([promise, timeout]);
}

/**
 * Safe wrapper for getting session that handles refresh token errors and timeouts
 */
export async function getSafeSession() {
  try {
    // Add 10 second timeout to prevent app from hanging on slow networks
    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      10000
    );

    if (error) {
      // Check for refresh token errors
      if (error.message?.includes('Refresh Token') ||
          error.message?.includes('refresh_token') ||
          error.message?.includes('Invalid Refresh Token')) {
        console.warn('Invalid refresh token detected, clearing session');
        await clearInvalidSession();
        return { session: null, error: null };
      }
      return { session: null, error };
    }

    return { session: data.session, error: null };
  } catch (e: any) {
    // Handle timeout errors - don't block the app
    if (e?.message?.includes('timed out')) {
      console.warn('Session check timed out, continuing without session');
      return { session: null, error: null };
    }
    // Handle refresh token errors
    if (e?.message?.includes('Refresh Token') ||
        e?.message?.includes('refresh_token')) {
      console.warn('Refresh token error caught, clearing session');
      await clearInvalidSession();
      return { session: null, error: null };
    }
    return { session: null, error: e };
  }
}
