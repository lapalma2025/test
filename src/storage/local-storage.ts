/**
 * Lokalna persystencja z fallbackiem:
 * - MMKV w development build / produkcji (szybszy, synchroniczny)
 * - AsyncStorage w Expo Go (brak natywnego modułu MMKV)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { StateStorage } from 'zustand/middleware';

function isExpoGo(): boolean {
  // Expo Go: appOwnership === 'expo' LUB executionEnvironment === 'storeClient'
  return (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === 'storeClient'
  );
}

function tryCreateMMKV(id: string) {
  if (isExpoGo()) return null;
  try {
    const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    const mmkv = new MMKV({ id });
    return mmkv;
  } catch {
    return null;
  }
}

export function createPersistStorage(id: string): StateStorage {
  const mmkv = tryCreateMMKV(id);
  const prefix = `${id}:`;

  if (mmkv) {
    return {
      getItem: (name) => mmkv.getString(name) ?? null,
      setItem: (name, value) => {
        mmkv.set(name, value);
      },
      removeItem: (name) => {
        mmkv.delete(name);
      },
    };
  }

  return {
    getItem: (name) => AsyncStorage.getItem(`${prefix}${name}`),
    setItem: (name, value) => AsyncStorage.setItem(`${prefix}${name}`, value),
    removeItem: (name) => AsyncStorage.removeItem(`${prefix}${name}`),
  };
}

export function createNamedStringStorage(id: string) {
  const mmkv = tryCreateMMKV(id);
  const prefix = `${id}:`;

  if (mmkv) {
    return {
      getString: async (key: string) => mmkv.getString(key),
      set: async (key: string, value: string) => {
        mmkv.set(key, value);
      },
      delete: async (key: string) => {
        mmkv.delete(key);
      },
    };
  }

  return {
    getString: (key: string) => AsyncStorage.getItem(`${prefix}${key}`),
    set: (key: string, value: string) => AsyncStorage.setItem(`${prefix}${key}`, value),
    delete: (key: string) => AsyncStorage.removeItem(`${prefix}${key}`),
  };
}
