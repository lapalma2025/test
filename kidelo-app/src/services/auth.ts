/**
 * auth.ts — funkcje auth: magic link email, OAuth Google/Apple, sign-out.
 *
 * Magic link: user wpisuje email → dostaje email z linkiem → klika → wraca do aplikacji.
 * OAuth: redirect przez przeglądarkę → callback do aplikacji (deep link kidelo://).
 */

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

// ============ EMAIL MAGIC LINK ============

export async function signInWithEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  const redirectUrl = Linking.createURL('/auth/callback');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
      shouldCreateUser: true,
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ============ OAUTH ============

export async function signInWithOAuth(
  provider: 'google' | 'apple'
): Promise<{ ok: boolean; error?: string }> {
  const redirectUrl = Linking.createURL('/auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) return { ok: false, error: error.message };
  if (!data?.url) return { ok: false, error: 'no_oauth_url' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

  if (result.type === 'success') {
    // Wyciągnij tokens z URL i ustaw sesję
    const url = result.url;
    const params = new URLSearchParams(url.split('#')[1] ?? '');
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token && refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sessionError) return { ok: false, error: sessionError.message };
      return { ok: true };
    }
    return { ok: false, error: 'no_tokens_in_callback' };
  }

  return { ok: false, error: result.type };
}

// ============ SIGN OUT ============

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ============ GUEST MODE ============

/**
 * "Guest mode" — aplikacja działa offline bez konta.
 * Dane w MMKV lokalnie. Gdy user zechce, może utworzyć konto
 * i wtedy zsync'ujemy lokalny stan do Supabase.
 */
export async function migrateLocalToServer(localProfile: any): Promise<{ ok: boolean }> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return { ok: false };

  const { error } = await supabase.from('user_profiles').upsert({
    user_id: userId,
    parent_name: localProfile.parentName,
    child_name: localProfile.childName,
    child_birth_date: localProfile.childBirthDate,
    child_due_date: localProfile.childDueDate,
    employment: localProfile.employment,
    voivodeship: localProfile.voivodeship,
    city: localProfile.city,
    first_child: localProfile.firstChild,
    partner_included: localProfile.partnerIncluded,
    partner_name: localProfile.partnerName,
    estimated_household_income_pln: localProfile.monthlyNetIncomePln,
    has_disability: localProfile.hasDisability,
  });

  return { ok: !error };
}
