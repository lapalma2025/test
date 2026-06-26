export interface Hospital {
  id: string;
  external_id: string;
  name: string;
  address_full: string;
  city: string;
  voivodeship: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  has_maternity: boolean;
  has_anesthesia: boolean | null;
  waiting_avg_days: number | null;
  rating: number | null;
  reviews_count: number;
  description?: string | null;
  source?: string;
  is_nfz?: boolean;
  email?: string | null;
  www?: string | null;
  tags?: string[];
  notes?: string | null;
  ref_level?: string | null;
  neonatal_level?: string | null;
  all_phones?: Array<{ label: string; number: string }>;
}

export interface BirthSchool {
  id: string;
  external_id?: string;
  name: string;
  hospital_id: string | null;
  type: 'stationary' | 'online' | 'hybrid';
  address_full?: string | null;
  city: string | null;
  voivodeship: string | null;
  is_nfz_free: boolean;
  price_pln: number | null;
  schedule: string | null;
  lang: string[];
  description: string | null;
  rating: number | null;
  reviews_count: number;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
  source?: string;
  is_nfz?: boolean;
  email?: string | null;
  www?: string | null;
  tags?: string[];
  notes?: string | null;
  payment?: string | null;
  all_phones?: Array<{ label: string; number: string }>;
}

export interface HospitalFilters {
  city?: string;
  voivodeship?: string;
  hasAnesthesia?: boolean;
  search?: string;
}

export interface SchoolFilters {
  city?: string;
  voivodeship?: string;
  type?: 'stationary' | 'online' | 'hybrid' | 'all';
  freeOnly?: boolean;
  search?: string;
}
