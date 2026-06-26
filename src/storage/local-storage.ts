/**
 * Lokalna persystencja z fallbackiem:
 * - MMKV w development build / produkcji (szybszy, synchroniczny)
 * - AsyncStorage w Expo Go (brak natywnego modułu MMKV)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { StateStorage } from 'zustand/middleware';

interface StringStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

function isExpoGo(): boolean {
  // Expo Go: appOwnership === 'expo' LUB executionEnvironment === 'storeClient'
  return (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === 'storeClient'
  );
}

function tryCreateMMKV(id: string): StringStorage | null {
  if (isExpoGo()) return null;
  try {
    const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    const mmkv = new MMKV({ id });
    return {
      getString: (key) => mmkv.getString(key),
      set: (key, value) => mmkv.set(key, value),
      delete: (key) => mmkv.delete(key),
    };
  } catch {
    return null;
  }
}

function createAsyncStringStorage(id: string): StringStorage {
  const prefix = `${id}:`;
  return {
    getString: (key) => {
      // Sync API nie jest dostępne w AsyncStorage — używamy cache w pamięci.
      return asyncStorageCache.get(`${prefix}${key}`);
    },
    set: (key, value) => {
      const fullKey = `${prefix}${key}`;
      asyncStorageCache.set(fullKey, value);
      void AsyncStorage.setItem(fullKey, value);
    },
    delete: (key) => {
      const fullKey = `${prefix}${key}`;
      asyncStorageCache.delete(fullKey);
      void AsyncStorage.removeItem(fullKey);
    },
  };
}

const asyncStorageCache = new Map<string, string>();
let asyncStorageHydrated = false;
let asyncStorageHydratePromise: Promise<void> | null = null;

export async function hydrateAsyncStorageCache(): Promise<void> {
  if (asyncStorageHydrated) return;
  if (!asyncStorageHydratePromise) {
    asyncStorageHydratePromise = AsyncStorage.getAllKeys()
      .then(async (keys) => {
        if (keys.length === 0) return;
        const entries = await AsyncStorage.multiGet(keys);
        for (const [key, value] of entries) {
          if (value != null) asyncStorageCache.set(key, value);
        }
      })
      .finally(() => {
        asyncStorageHydrated = true;
      });
  }
  await asyncStorageHydratePromise;
}

function createStringStorage(id: string): StringStorage {
  return tryCreateMMKV(id) ?? createAsyncStringStorage(id);
}

export function createPersistStorage(id: string): StateStorage {
  const storage = createStringStorage(id);

  return {
    getItem: async (name) => {
      await hydrateAsyncStorageCache();
      return storage.getString(name) ?? null;
    },
    setItem: async (name, value) => {
      await hydrateAsyncStorageCache();
      storage.set(name, value);
    },
    removeItem: async (name) => {
      await hydrateAsyncStorageCache();
      storage.delete(name);
    },
  };
}

export function createNamedStringStorage(id: string) {
  const storage = createStringStorage(id);

  return {
    getString: async (key: string) => {
      await hydrateAsyncStorageCache();
      return storage.getString(key);
    },
    set: async (key: string, value: string) => {
      await hydrateAsyncStorageCache();
      storage.set(key, value);
    },
    delete: async (key: string) => {
      await hydrateAsyncStorageCache();
      storage.delete(key);
    },
  };
}
