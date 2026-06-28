/**
 * supabase.ts — klient Supabase z bezpieczną persystencją sesji.
 *
 * Używamy expo-secure-store (Keychain iOS / EncryptedSharedPreferences Android)
 * zamiast MMKV dla tokenów — to są wrażliwe dane.
 */

import 'react-native-url-polyfill/auto';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ============ ENV ============

const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[supabase] Brak EXPO_PUBLIC_SUPABASE_URL lub EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Aplikacja działa offline na danych lokalnych.'
  );
}

// ============ SECURE STORAGE ADAPTER ============

const ExpoSecureStoreAdapter: SupportedStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// ============ CLIENT ============

/** Placeholder — createClient rzuca przy pustym URL; offline app nie powinna padać przy starcie. */
const OFFLINE_SUPABASE_URL = 'https://offline.kidelo.local';
const OFFLINE_SUPABASE_KEY = 'offline';

export const supabase = createClient(
  SUPABASE_URL || OFFLINE_SUPABASE_URL,
  SUPABASE_ANON_KEY || OFFLINE_SUPABASE_KEY,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
      persistSession: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
      detectSessionInUrl: false, // mobile — nie ma URL flow
    },
    global: {
      headers: {
        'X-Client-Info': 'kidelo-mobile',
      },
    },
  }
);

// ============ KIDELO MOBILE SCHEMA ============

/** Klient z domyślnym schematem kidelo_mobile — używaj do wszystkich zapytań mobilki */
export const kideloDb = supabase.schema('kidelo_mobile');

// ============ HELPERS ============

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
