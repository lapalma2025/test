import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Nieprawidłowy e-mail lub hasło.';
  if (msg.includes('Email not confirmed')) return 'Potwierdź adres e-mail przed zalogowaniem.';
  if (msg.includes('already registered') || msg.includes('User already registered'))
    return 'Konto z tym adresem e-mail już istnieje.';
  if (msg.includes('Password should be')) return 'Hasło musi mieć co najmniej 6 znaków.';
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.';
  return msg;
}

// ============ EMAIL + HASŁO ============

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: translateError(error.message) };
  return { ok: true };
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: translateError(error.message) };
  if (data.user && !data.session) {
    return { ok: true, needsConfirmation: true };
  }
  return { ok: true };
}

// ============ RESET HASŁA ============

export async function resetPassword(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (error) return { ok: false, error: translateError(error.message) };
  return { ok: true };
}

// ============ SIGN OUT ============

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ============ DELETE ACCOUNT ============

export async function deleteAccount(): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('delete_user_account');
  if (error) return { ok: false, error: error.message };
  await supabase.auth.signOut();
  return { ok: true };
}

// ============ MAGIC LINK ============

export async function signInWithEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  const redirectUrl = Linking.createURL('/auth/callback');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectUrl, shouldCreateUser: true },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ============ OAUTH ============

export async function signInWithOAuth(
  provider: 'google' | 'apple',
): Promise<{ ok: boolean; error?: string }> {
  const redirectUrl = Linking.createURL('/auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
  });
  if (error) return { ok: false, error: error.message };
  if (!data?.url) return { ok: false, error: 'no_oauth_url' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
  if (result.type === 'success') {
    const params = new URLSearchParams(result.url.split('#')[1] ?? '');
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
      if (sessionError) return { ok: false, error: sessionError.message };
      return { ok: true };
    }
    return { ok: false, error: 'no_tokens_in_callback' };
  }
  return { ok: false, error: result.type };
}
