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
 * Send a password reset email with OTP code (Custom implementation via Edge Function)
 * This bypasses Supabase Auth's redirect-based flows
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PUBLIC_URL || '';

    const response = await fetch(`${supabaseUrl}/functions/v1/send-reset-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.error?.includes('not found') || data.error?.includes('No user')) {
        return { success: false, error: 'No account found with this email address.' };
      }
      return { success: false, error: data.error || 'Failed to send reset code.' };
    }

    return { success: true };
  } catch (err) {
    console.error('resetPassword error:', err);
    return { success: false, error: 'Failed to send reset code. Please try again.' };
  }
}

/**
 * Verify OTP code and set new password (Custom implementation via Edge Function)
 */
export async function verifyOtpAndResetPassword(email: string, otp: string, newPassword: string): Promise<AuthResult> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PUBLIC_URL || '';

    // First verify the OTP
    const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/verify-reset-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code: otp }),
    });

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      if (verifyData.error?.includes('expired')) {
        return { success: false, error: 'Code has expired. Please request a new one.' };
      }
      if (verifyData.error?.includes('Invalid') || verifyData.error?.includes('incorrect')) {
        return { success: false, error: 'Invalid code. Please check and try again.' };
      }
      return { success: false, error: verifyData.error || 'Verification failed.' };
    }

    // OTP verified - now we need to update the password in Supabase Auth
    // We'll use the admin token returned from verify-reset-code to update the user
    if (verifyData.resetToken) {
      const updateResponse = await fetch(`${supabaseUrl}/functions/v1/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword,
          resetToken: verifyData.resetToken
        }),
      });

      const updateData = await updateResponse.json();

      if (!updateResponse.ok) {
        return { success: false, error: updateData.error || 'Failed to update password.' };
      }
    }

    return { success: true };
  } catch (err) {
    console.error('verifyOtpAndResetPassword error:', err);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
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
