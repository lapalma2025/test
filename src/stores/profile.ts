/**
 * profile.ts — Zustand store profilu użytkownika z lokalną persystencją.
 * W Expo Go: AsyncStorage. W buildzie natywnym: MMKV (gdy dostępny).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { UserProfile, EmploymentType } from '@/engine/eligibility-engine';
import { createPersistStorage } from '@/storage/local-storage';

// ============ TYPY ============

export interface ProfileState {
  // Czy ukończono onboarding
  isOnboarded: boolean;

  // Dane usera (mapują się 1:1 na UserProfile silnika)
  childName: string;
  childDueDate: string | null;    // ISO string (Date nie serializuje się w JSON)
  childBirthDate: string | null;
  firstChild: boolean;
  employment: EmploymentType;
  partnerEmployment: EmploymentType | null;
  voivodeship: string;
  city: string;
  parentName: string;
  partnerName: string | null;
  partnerIncluded: boolean;
  monthlyNetIncomePln: number;
  partnerMonthlyNetIncomePln: number;
  householdSize: number;
  hasDisability: boolean;
  prenatalCareSince10thWeek: boolean;
  numberOfChildren: number;

  // UI preferences
  notificationsEnabled: {
    push: boolean;
    reminders: boolean;
    deadlines: boolean;
    newBenefits: boolean;
  };

  // Czy użytkownik świadomie wybrał tryb gościa (nie pokazuj auth ponownie)
  hasSkippedAuth: boolean;

  // Actions
  setField: <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => void;
  setMany: (partial: Partial<ProfileState>) => void;
  completeOnboarding: () => void;
  skipAuth: () => void;
  reset: () => void;

  // Computed
  toUserProfile: () => UserProfile;
}

// ============ DEFAULTS ============

const initialState = {
  isOnboarded: false,
  hasSkippedAuth: false,
  childName: '',
  childDueDate: null,
  childBirthDate: null,
  firstChild: true,
  employment: 'uop' as EmploymentType,
  partnerEmployment: null,
  voivodeship: 'mazowieckie',
  city: '',
  parentName: '',
  partnerName: null,
  partnerIncluded: false,
  monthlyNetIncomePln: 0,
  partnerMonthlyNetIncomePln: 0,
  householdSize: 2,
  hasDisability: false,
  prenatalCareSince10thWeek: false,
  numberOfChildren: 1,
  notificationsEnabled: {
    push: true,
    reminders: true,
    deadlines: true,
    newBenefits: false,
  },
};

// ============ STORE ============

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setField: (key, value) => set({ [key]: value } as Partial<ProfileState>),

      setMany: (partial) => set(partial),

      completeOnboarding: () => set({ isOnboarded: true }),

      skipAuth: () => set({ hasSkippedAuth: true }),

      reset: () => set(initialState),

      toUserProfile: (): UserProfile => {
        const s = get();
        return {
          childName: s.childName || undefined,
          childDueDate: s.childDueDate ? new Date(s.childDueDate) : undefined,
          childBirthDate: s.childBirthDate ? new Date(s.childBirthDate) : undefined,
          firstChild: s.firstChild,
          employment: s.employment,
          partnerEmployment: s.partnerEmployment ?? undefined,
          voivodeship: s.voivodeship,
          city: s.city,
          household: {
            sizeInPersons: s.householdSize,
            monthlyNetIncomePln: s.monthlyNetIncomePln + s.partnerMonthlyNetIncomePln,
          },
          hasDisability: s.hasDisability,
          prenatalCareSince10thWeek: s.prenatalCareSince10thWeek,
          numberOfChildren: s.numberOfChildren,
        };
      },
    }),
    {
      name: 'kidelo-profile-v1',
      storage: createJSONStorage(() => createPersistStorage('kidelo-profile')),
      partialize: (state) => {
        const { setField, setMany, completeOnboarding, reset, toUserProfile, ...rest } = state;
        return rest;
      },
    }
  )
);
