/**
 * eligibility-engine.test.ts — 25 scenariuszy testowych dla silnika eligibility.
 *
 * Pokrywa wszystkie kombinacje:
 *   - przed porodem / po porodzie / dziecko > 12 mies / dziecko > 35 mies
 *   - UoP / B2B chorobowe / B2B bez / zlecenie / student / bez pracy
 *   - pierwsze / kolejne dziecko
 *   - z partnerem aktywnym / bez partnera
 *   - z/bez niepełnosprawności
 *   - dochód powyżej/poniżej progu becikowego
 *
 * Uruchomienie:
 *   npm test
 *   npm test -- --watch
 */

import { checkEligibility, type UserProfile, type BenefitsDataset } from '../eligibility-engine';
import benefitsData from '../../data/benefits.json';

const BENEFITS = benefitsData as unknown as BenefitsDataset;

// ============ HELPERS ============

function createBaseProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    childBirthDate: new Date('2026-05-26'),
    firstChild: true,
    employment: 'uop',
    partnerEmployment: 'uop',
    voivodeship: 'mazowieckie',
    city: 'Warszawa',
    household: { sizeInPersons: 3, monthlyNetIncomePln: 8000 },
    hasDisability: false,
    prenatalCareSince10thWeek: true,
    numberOfChildren: 1,
    ...overrides,
  };
}

const NOW_AFTER_BIRTH = new Date('2026-06-09'); // 14 dni po porodzie
const NOW_PRE_BIRTH = new Date('2026-02-15');   // przed porodem (24 tyg ciąży)
const NOW_12_MONTHS_OLD = new Date('2027-06-09');
const NOW_36_MONTHS_OLD = new Date('2029-06-09');

function findBenefit(results: ReturnType<typeof checkEligibility>, id: string) {
  const r = results.find((x) => x.benefitId === id);
  if (!r) throw new Error(`Brak benefitu ${id} w wynikach`);
  return r;
}

// ============ TESTY ============

describe('eligibility-engine', () => {
  // ---------- 800+ ----------
  describe('800+', () => {
    it('przed porodem: future', () => {
      const p = createBaseProfile({ childBirthDate: undefined, childDueDate: new Date('2026-09-01') });
      const r = checkEligibility(p, BENEFITS, NOW_PRE_BIRTH);
      expect(findBenefit(r, '800plus').eligibility).toBe('future');
    });

    it('po porodzie w 3 mies: action z deadlinem', () => {
      const p = createBaseProfile();
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), '800plus');
      expect(r.eligibility).toBe('action');
      expect(r.deadlineAt).toEqual(new Date('2026-08-26'));
      expect(r.amountPln).toBe(800);
    });

    it('po porodzie > 3 mies: action ale bez wyrównania', () => {
      const p = createBaseProfile();
      const now = new Date('2026-10-01'); // ~5 mies po porodzie
      const r = findBenefit(checkEligibility(p, BENEFITS, now), '800plus');
      expect(r.eligibility).toBe('action');
      expect(r.reasoning).toContain('bez wyrównania');
    });

    it('total projected: 800 zł × miesiące do 18 r.ż.', () => {
      const p = createBaseProfile();
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), '800plus');
      expect(r.totalProjectedPln).toBeGreaterThan(170000); // ~18 lat × 9600 zł
      expect(r.totalProjectedPln).toBeLessThan(180000);
    });
  });

  // ---------- BECIKOWE ----------
  describe('becikowe', () => {
    it('dochód poniżej progu + opieka od 10 tyg: action', () => {
      const p = createBaseProfile({
        household: { sizeInPersons: 4, monthlyNetIncomePln: 5000 }, // 1250/os
        prenatalCareSince10thWeek: true,
      });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), 'becikowe');
      expect(r.eligibility).toBe('action');
      expect(r.amountPln).toBe(1000);
    });

    it('dochód powyżej progu: na', () => {
      const p = createBaseProfile({
        household: { sizeInPersons: 2, monthlyNetIncomePln: 8000 }, // 4000/os
      });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), 'becikowe');
      expect(r.eligibility).toBe('na');
      expect(r.reasoning).toContain('Dochód');
    });

    it('brak opieki od 10 tyg: na', () => {
      const p = createBaseProfile({
        household: { sizeInPersons: 5, monthlyNetIncomePln: 3000 },
        prenatalCareSince10thWeek: false,
      });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), 'becikowe');
      expect(r.eligibility).toBe('na');
      expect(r.reasoning).toContain('opieka medyczna');
    });

    it('po 12 miesiącach od porodu: na', () => {
      const p = createBaseProfile({
        household: { sizeInPersons: 5, monthlyNetIncomePln: 3000 },
      });
      const lateDate = new Date('2027-06-09'); // 13 mies po porodzie
      const r = findBenefit(checkEligibility(p, BENEFITS, lateDate), 'becikowe');
      expect(r.eligibility).toBe('na');
    });
  });

  // ---------- MACIERZYŃSKI ----------
  describe('zasiłek macierzyński', () => {
    it('UoP: action w pierwszych 21 dniach', () => {
      const p = createBaseProfile({ employment: 'uop' });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), 'macierzynski');
      expect(r.eligibility).toBe('action');
      expect(r.reasoning).toContain('81,5%');
    });

    it('po 21 dniach: active (po terminie 81,5%)', () => {
      const p = createBaseProfile({ employment: 'uop' });
      const lateDate = new Date('2026-06-20'); // 25 dni
      const r = findBenefit(checkEligibility(p, BENEFITS, lateDate), 'macierzynski');
      expect(r.eligibility).toBe('active');
    });

    it('student: na (kosiniakowe zamiast)', () => {
      const p = createBaseProfile({ employment: 'student' });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), 'macierzynski');
      expect(r.eligibility).toBe('na');
    });

    it('B2B bez chorobowego: na', () => {
      const p = createBaseProfile({ employment: 'b2b_no_chorobowe' });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), 'macierzynski');
      expect(r.eligibility).toBe('na');
    });

    it('B2B z chorobowym: action', () => {
      const p = createBaseProfile({ employment: 'b2b_chorobowe' });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), 'macierzynski');
      expect(r.eligibility).toBe('action');
    });
  });

  // ---------- KOSINIAKOWE ----------
  describe('kosiniakowe', () => {
    it('student: action', () => {
      const p = createBaseProfile({ employment: 'student' });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), 'kosiniakowe');
      expect(r.eligibility).toBe('action');
      expect(r.amountPln).toBe(1000);
    });

    it('UoP: na (kosiniakowe się wyklucza z macierzyńskim)', () => {
      const p = createBaseProfile({ employment: 'uop' });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), 'kosiniakowe');
      expect(r.eligibility).toBe('na');
    });

    it('bez pracy: action', () => {
      const p = createBaseProfile({ employment: 'none' });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), 'kosiniakowe');
      expect(r.eligibility).toBe('action');
    });

    it('total: 12 000 zł (1000 × 12 mies)', () => {
      const p = createBaseProfile({ employment: 'student' });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), 'kosiniakowe');
      expect(r.totalProjectedPln).toBe(12000);
    });
  });

  // ---------- AKTYWNI RODZICE W PRACY ----------
  describe('aktywni rodzice w pracy', () => {
    it('dziecko < 12 mies: future', () => {
      const p = createBaseProfile();
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), 'aktywni-rodzice-w-pracy');
      expect(r.eligibility).toBe('future');
    });

    it('dziecko 12-35 mies + oboje pracują UoP: action 1500 zł', () => {
      const p = createBaseProfile();
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_12_MONTHS_OLD), 'aktywni-rodzice-w-pracy');
      expect(r.eligibility).toBe('action');
      expect(r.amountPln).toBe(1500);
    });

    it('dziecko z niepełnosprawnością: 1900 zł', () => {
      const p = createBaseProfile({ hasDisability: true });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_12_MONTHS_OLD), 'aktywni-rodzice-w-pracy');
      expect(r.amountPln).toBe(1900);
    });

    it('jedno z rodziców nie pracuje: na', () => {
      const p = createBaseProfile({ partnerEmployment: 'none' });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_12_MONTHS_OLD), 'aktywni-rodzice-w-pracy');
      expect(r.eligibility).toBe('na');
    });

    it('dziecko > 35 mies: na', () => {
      const p = createBaseProfile();
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_36_MONTHS_OLD), 'aktywni-rodzice-w-pracy');
      expect(r.eligibility).toBe('na');
    });
  });

  // ---------- RKO ----------
  describe('RKO (Rodzinny Kapitał Opiekuńczy)', () => {
    it('zawsze na — RKO wycofane od 1.10.2024, pierwsze dziecko', () => {
      const p = createBaseProfile({ firstChild: true });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_12_MONTHS_OLD), 'rko');
      expect(r.eligibility).toBe('na');
      expect(r.reasoning).toContain('wycofane');
    });

    it('zawsze na — RKO wycofane od 1.10.2024, drugie dziecko w oknie wiekowym', () => {
      const p = createBaseProfile({ firstChild: false, numberOfChildren: 2 });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_12_MONTHS_OLD), 'rko');
      expect(r.eligibility).toBe('na');
      expect(r.amountPln).toBeNull();
      expect(r.reasoning).toContain('Aktywnie w domu');
    });

    it('zawsze na — RKO wycofane od 1.10.2024, drugie dziecko starsze', () => {
      const p = createBaseProfile({
        firstChild: false,
        childBirthDate: new Date('2025-01-01'),
      });
      const r = findBenefit(checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH), 'rko');
      expect(r.eligibility).toBe('na');
    });
  });

  // ---------- KOMPLEKSOWE SCENARIUSZE ----------
  describe('persona scenariusze', () => {
    it('Anna: UoP, pierwsze dziecko, 14 dni po porodzie, średnie zarobki', () => {
      const p = createBaseProfile({
        household: { sizeInPersons: 3, monthlyNetIncomePln: 12000 }, // 4000/os — za dużo na becikowe
      });
      const results = checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH);

      expect(findBenefit(results, '800plus').eligibility).toBe('action');
      expect(findBenefit(results, 'becikowe').eligibility).toBe('na'); // za wysoki dochód
      expect(findBenefit(results, 'macierzynski').eligibility).toBe('action');
      expect(findBenefit(results, 'kosiniakowe').eligibility).toBe('na');
      expect(findBenefit(results, 'aktywni-rodzice-w-pracy').eligibility).toBe('future');
      expect(findBenefit(results, 'rko').eligibility).toBe('na'); // pierwsze dziecko
    });

    it('Kasia: student, drugie dziecko, niski dochód, niepełnosprawność', () => {
      const p = createBaseProfile({
        employment: 'student',
        partnerEmployment: undefined,
        firstChild: false,
        numberOfChildren: 2,
        hasDisability: true,
        household: { sizeInPersons: 4, monthlyNetIncomePln: 4000 }, // 1000/os — kwalifikuje na becikowe
      });
      const results = checkEligibility(p, BENEFITS, NOW_AFTER_BIRTH);

      expect(findBenefit(results, 'becikowe').eligibility).toBe('action');
      expect(findBenefit(results, 'kosiniakowe').eligibility).toBe('action');
      expect(findBenefit(results, 'macierzynski').eligibility).toBe('na');
    });
  });
});
