/**
 * useHospitals.ts — szpitale i szkoły rodzenia wyłącznie z master-szpitale-szkoly-PL.json
 */

import { useQuery } from '@tanstack/react-query';
import { applyHospitalFilters, applySchoolFilters } from '@/services/places-merge';
import { loadMasterDatasets } from '@/data/places-datasets';
import type { BirthSchool, Hospital, HospitalFilters, SchoolFilters } from '@/types/places';

export type { BirthSchool, Hospital, HospitalFilters, SchoolFilters } from '@/types/places';

export function useHospitals(filters: HospitalFilters = {}) {
  return useQuery({
    queryKey: ['hospitals', 'master', filters],
    queryFn: async (): Promise<Hospital[]> => {
      const { masterHospitals } = await loadMasterDatasets();
      return applyHospitalFilters(masterHospitals, filters);
    },
    staleTime: Infinity,
  });
}

export function useHospital(id: string | undefined) {
  return useQuery({
    queryKey: ['hospital', 'master', id],
    queryFn: async (): Promise<Hospital | null> => {
      if (!id) return null;
      const { masterHospitals } = await loadMasterDatasets();
      return masterHospitals.find((h) => h.id === id) ?? null;
    },
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}

export function useSchools(filters: SchoolFilters = {}) {
  return useQuery({
    queryKey: ['schools', 'master', filters],
    queryFn: async (): Promise<BirthSchool[]> => {
      const { masterSchools } = await loadMasterDatasets();
      return applySchoolFilters(masterSchools, filters);
    },
    staleTime: Infinity,
  });
}

export function useSchool(id: string | undefined) {
  return useQuery({
    queryKey: ['school', 'master', id],
    queryFn: async (): Promise<BirthSchool | null> => {
      if (!id) return null;
      const { masterSchools } = await loadMasterDatasets();
      return masterSchools.find((s) => s.id === id) ?? null;
    },
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}
