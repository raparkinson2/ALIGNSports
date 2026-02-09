import { supabase, clearInvalidSession, getSafeSession } from './supabase';

export interface AuthResult {
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Sign up a new user with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult & { emailConfirmationRequired?: boolean; alreadyRegistered?: boolean }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Check for "already registered" error
      const errorLower = error.message.toLowerCase();
      if (errorLower.includes('already registered') ||
          errorLower.includes('already been registered') ||
          errorLower.includes('user already registered')) {
        return { success: false, error: 'This email is already registered. Please sign in instead.', alreadyRegistered: true };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create account' };
    }

    // Check if email confirmation is required
    // If identities array is empty, email confirmation is pending (user already exists but unconfirmed)
    const emailConfirmationRequired = !data.user.email_confirmed_at &&
      (!data.user.identities || data.user.identities.length === 0);

    // If identities is empty, the user already exists but hasn't confirmed their email
    if (!data.user.identities || data.user.identities.length === 0) {
      return {
        success: false,
        error: 'This email is already registered. Please check your inbox for a confirmation email or sign in.',
        alreadyRegistered: true,
        emailConfirmationRequired: true
      };
    }

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
    // Clear any invalid sessions before attempting login
    await clearInvalidSession().catch(() => {});

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Handle refresh token errors by clearing session and retrying
      if (error.message?.includes('Refresh Token') ||
          error.message?.includes('refresh_token')) {
        await clearInvalidSession();
        return { success: false, error: 'Session expired. Please try again.' };
      }
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
  } catch (err: any) {
    // Handle refresh token errors in catch block
    if (err?.message?.includes('Refresh Token') ||
        err?.message?.includes('refresh_token')) {
      await clearInvalidSession();
      return { success: false, error: 'Session expired. Please try again.' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Sign out the current user (handles refresh token errors gracefully)
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      // If there's a refresh token error during sign out, clear the session anyway
      if (error.message?.includes('Refresh Token') ||
          error.message?.includes('refresh_token')) {
        await clearInvalidSession();
        return { success: true }; // Consider it a success since session is cleared
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    // Handle refresh token errors
    if (err?.message?.includes('Refresh Token') ||
        err?.message?.includes('refresh_token')) {
      await clearInvalidSession();
      return { success: true }; // Consider it a success
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Send a password reset OTP via SMS (Custom implementation via Edge Function with Twilio)
 * This bypasses Supabase Auth's redirect-based flows
 */
export async function sendPasswordResetSMS(phone: string, email?: string): Promise<AuthResult> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PUBLIC_URL || '';

    const response = await fetch(`${supabaseUrl}/functions/v1/send-reset-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, email }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.error?.includes('not found') || data.error?.includes('No user')) {
        return { success: false, error: 'No account found with this phone number.' };
      }
      return { success: false, error: data.error || 'Failed to send reset code.' };
    }

    return { success: true };
  } catch (err) {
    console.error('sendPasswordResetSMS error:', err);
    return { success: false, error: 'Failed to send reset code. Please try again.' };
  }
}

/**
 * Verify SMS OTP code and set new password (Custom implementation via Edge Function)
 */
export async function verifySMSOtpAndResetPassword(phone: string, otp: string, newPassword: string, email?: string): Promise<AuthResult> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PUBLIC_URL || '';

    // First verify the OTP
    const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/verify-reset-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, code: otp }),
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

    // OTP verified - now update the password
    if (verifyData.resetToken) {
      const updateResponse = await fetch(`${supabaseUrl}/functions/v1/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
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
    console.error('verifySMSOtpAndResetPassword error:', err);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Get the current authenticated user (handles refresh token errors gracefully)
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      // Handle refresh token errors
      if (error.message?.includes('Refresh Token') ||
          error.message?.includes('refresh_token') ||
          error.message?.includes('Invalid Refresh Token')) {
        console.warn('Invalid refresh token in getCurrentUser, clearing session');
        await clearInvalidSession();
        return null;
      }
      return null;
    }

    if (!user) {
      return null;
    }

    return user;
  } catch (e: any) {
    // Handle unexpected refresh token errors
    if (e?.message?.includes('Refresh Token') ||
        e?.message?.includes('refresh_token')) {
      await clearInvalidSession();
    }
    return null;
  }
}

/**
 * Get the current session (handles refresh token errors gracefully)
 */
export async function getSession() {
  try {
    const { session, error } = await getSafeSession();

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
 * Check if an email is already registered in Supabase Auth
 * NOTE: We skip real-time Supabase checks to avoid accidentally creating users.
 * The actual duplicate check happens during signUpWithEmail.
 * This function only does local/format validation now.
 */
export async function checkEmailExists(_email: string): Promise<{ exists: boolean; error?: string }> {
  // We intentionally don't check Supabase here to avoid side effects
  // The signUpWithEmail function will return an error if the email is already registered
  return { exists: false };
}

/**
 * Check if a phone number is already associated with a user
 * Queries the profiles table or auth.users via RPC
 */
export async function checkPhoneExists(phone: string): Promise<{ exists: boolean; error?: string }> {
  try {
    // First normalize the phone number (remove formatting)
    const normalizedPhone = phone.replace(/\D/g, '');

    // Try to query the profiles table if it exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (error) {
      // Table might not exist or other error - try alternative approach
      console.warn('Could not check profiles table:', error.message);
      return { exists: false };
    }

    return { exists: !!data };
  } catch (err) {
    console.error('checkPhoneExists error:', err);
    return { exists: false, error: 'Could not verify phone' };
  }
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
