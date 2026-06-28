import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

// Tłumaczenia błędów Supabase → Polish
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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { ok: false, error: translateError(error.message) };

  // Ścisła weryfikacja: tylko konta zarejestrowane przez aplikację mobilną.
  // Konta portalu (web) nie mają source='kidelo' w user_metadata.
  const source = data.user?.user_metadata?.source;
  if (source !== 'kidelo') {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: 'Ten adres e-mail jest zarejestrowany w innym produkcie. Użyj innego e-maila lub zarejestruj nowe konto.',
    };
  }

  return { ok: true };
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { source: 'kidelo' }, // zapisane w user_metadata — oznacznik konta mobilnego
    },
  });

  if (error) return { ok: false, error: translateError(error.message) };

  // Supabase może wymagać potwierdzenia e-mail (session === null po rejestracji)
  if (data.user && !data.session) {
    return { ok: true, needsConfirmation: true };
  }

  return { ok: true };
}

// ============ MAGIC LINK (zachowane dla kompatybilności) ============

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

// ============ RESET HASŁA ============

export async function resetPassword(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  // Supabase wysyła email z linkiem do zresetowania hasła.
  // Bez redirectTo Supabase używa Site URL z ustawień projektu → strona webowa z formularzem.
  // Użytkownik wchodzi na stronę, wpisuje nowe hasło, wraca do apki i loguje się.
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (error) return { ok: false, error: translateError(error.message) };
  return { ok: true };
}

// ============ SIGN OUT ============

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ============ MIGRACJA DANYCH GOŚCIA ============

export async function migrateLocalToServer(localProfile: any): Promise<{ ok: boolean }> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return { ok: false };

  const { error } = await supabase.from('kidelo_profiles').upsert({
    id: userId,
    child_name: localProfile.childName,
    child_birth_date: localProfile.childBirthDate || null,
    child_due_date: localProfile.childDueDate || null,
    is_pregnant: localProfile.isPregnant,
    employment: localProfile.employment,
    voivodeship: localProfile.voivodeship,
    first_child: localProfile.firstChild,
    has_disability: localProfile.hasDisability,
  });

  return { ok: !error };
}
