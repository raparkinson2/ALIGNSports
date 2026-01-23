import { supabase } from './supabase';

export interface AuthResult {
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Sign up a new user with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult & { emailConfirmationRequired?: boolean }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create account' };
    }

    // Check if email confirmation is required
    // If identities array is empty, email confirmation is pending
    const emailConfirmationRequired = !data.user.email_confirmed_at &&
      (!data.user.identities || data.user.identities.length === 0);

    return {
      success: true,
      userId: data.user.id,
      emailConfirmationRequired
    };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult & { emailNotConfirmed?: boolean }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Provide user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Invalid email or password' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { success: false, error: 'Please check your email to confirm your account before signing in.', emailNotConfirmed: true };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to sign in' };
    }

    // Double-check email confirmation status
    if (!data.user.email_confirmed_at) {
      // Sign out the user since they haven't confirmed their email
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Please check your email to confirm your account before signing in.',
        emailNotConfirmed: true
      };
    }

    return { success: true, userId: data.user.id };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Send a password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'alignsports://reset-password',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Resend email confirmation
 */
export async function resendConfirmationEmail(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}
