/**
 * Lazy loader — wyłącznie master-szpitale-szkoly-PL.json
 */

import type { BirthSchool, Hospital } from '@/types/places';

interface MasterDatasets {
  masterHospitals: Hospital[];
  masterSchools: BirthSchool[];
}

let cache: MasterDatasets | null = null;
let loadPromise: Promise<MasterDatasets> | null = null;

export async function loadMasterDatasets(): Promise<MasterDatasets> {
  if (cache) return cache;
  if (!loadPromise) {
    loadPromise = (async () => {
      const masterMod = await import('@/data/master-data');
      cache = {
        masterHospitals: masterMod.getMasterHospitals(),
        masterSchools: masterMod.getMasterSchools(),
      };
      return cache;
    })();
  }
  return loadPromise;
}

/** @deprecated użyj loadMasterDatasets */
export const loadPlaceDatasets = loadMasterDatasets;
