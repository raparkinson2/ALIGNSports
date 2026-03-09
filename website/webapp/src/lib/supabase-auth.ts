import { getSupabaseClient } from './supabase';

export interface AuthResult {
  success: boolean;
  error?: string;
  userId?: string;
  emailNotConfirmed?: boolean;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message?.includes('Refresh Token') || error.message?.includes('refresh_token')) {
        await supabase.auth.signOut();
        return { success: false, error: 'Session expired. Please try again.' };
      }
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Invalid email or password' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { success: false, error: 'Please check your email to confirm your account before signing in.', emailNotConfirmed: true };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) return { success: false, error: 'Failed to sign in' };

    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return { success: false, error: 'Please check your email to confirm your account before signing in.', emailNotConfirmed: true };
    }

    return { success: true, userId: data.user.id };
  } catch (err: any) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function getCurrentUser() {
  try {
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function resendConfirmationEmail(email: string): Promise<AuthResult> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'An unexpected error occurred' };
  }
}
