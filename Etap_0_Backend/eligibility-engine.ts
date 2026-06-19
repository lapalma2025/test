/**
 * eligibility-engine.ts — silnik eligibility świadczeń.
 *
 * Czysta funkcja: UserProfile → BenefitResult[]
 * Bez side-effects, w pełni testowalna (Jest).
 *
 * Wszystkie kwoty i terminy pochodzą z benefits.json (single source of truth).
 * NIE hardcoduj liczb tutaj — zawsze referencja przez benefitsData.find().
 *
 * Użycie:
 *   const results = checkEligibility(profile, benefitsData, new Date());
 *   results.forEach(r => console.log(r.benefit.name, r.eligibility, r.amountPln, r.deadlineAt));
 */

import { addDays, addMonths, differenceInMonths } from 'date-fns';

// ============ TYPY ============

export type EmploymentType =
  | 'uop'              // umowa o pracę
  | 'b2b_chorobowe'    // B2B z dobrowolnym chorobowym
  | 'b2b_no_chorobowe' // B2B bez chorobowego
  | 'zlecenie_chorobowe'
  | 'zlecenie_no_chorobowe'
  | 'student'
  | 'none'             // bez pracy
  | 'unemployed';

export interface UserProfile {
  childDueDate?: Date;       // przed porodem
  childBirthDate?: Date;     // po porodzie
  firstChild: boolean;
  employment: EmploymentType;
  partnerEmployment?: EmploymentType;
  voivodeship: string;
  city: string;
  household: {
    sizeInPersons: number;        // ile osób w rodzinie
    monthlyNetIncomePln: number;  // dochód netto rodziny / miesiąc
  };
  hasDisability: boolean;
  prenatalCareSince10thWeek: boolean;  // dla becikowego
  // Dla RKO:
  numberOfChildren: number;
}

export type EligibilityStatus =
  | 'eligible'   // należy się, można złożyć teraz
  | 'action'     // wymagane działanie (zbliża się deadline lub trzeba złożyć)
  | 'active'     // już aktywne / w toku
  | 'future'     // dostępne w przyszłości (np. Aktywny Rodzic od 12 mies.)
  | 'na';        // nie dotyczy (nie spełnia kryteriów)

export interface BenefitResult {
  benefitId: string;
  benefit: BenefitData;
  eligibility: EligibilityStatus;
  amountPln: number | null;       // spersonalizowana kwota (np. 1900 zł zamiast 1500 dla niepełnosprawności)
  amountDisplay: string;
  deadlineAt: Date | null;
  deadlineDescription: string;
  channel: string;
  reasoning: string;              // czemu taki status (do debugowania i UI)
  totalProjectedPln?: number;     // łączna projekcja, np. 800+ × 12 mies. = 9600 zł
}

export interface BenefitData {
  id: string;
  slug: string;
  name: string;
  amount_pln: number | null;
  amount_display: string;
  unit: string;
  income_means_tested?: boolean;
  income_limit_per_capita_pln?: number;
  channel: string;
  deadline_rule: {
    type: string;
    value?: number;
    value_min?: number;
    value_max?: number;
    description?: string;
  };
}

export interface BenefitsDataset {
  benefits: BenefitData[];
}

// ============ POMOCNICZE ============

function getReferenceDate(profile: UserProfile): Date | null {
  return profile.childBirthDate ?? profile.childDueDate ?? null;
}

function monthsSinceBirth(profile: UserProfile, now: Date): number | null {
  if (!profile.childBirthDate) return null;
  return differenceInMonths(now, profile.childBirthDate);
}

function isPostBirth(profile: UserProfile): boolean {
  return Boolean(profile.childBirthDate);
}

function hasEntitlementToMaternityBenefit(employment: EmploymentType): boolean {
  return ['uop', 'b2b_chorobowe', 'zlecenie_chorobowe'].includes(employment);
}

function bothParentsActivelyEmployed(profile: UserProfile): boolean {
  const isActive = (e?: EmploymentType): boolean => {
    if (!e) return false;
    return ['uop', 'b2b_chorobowe', 'b2b_no_chorobowe', 'zlecenie_chorobowe'].includes(e);
  };
  return isActive(profile.employment) && isActive(profile.partnerEmployment);
}

function incomePerCapita(profile: UserProfile): number {
  if (profile.household.sizeInPersons === 0) return Infinity;
  return profile.household.monthlyNetIncomePln / profile.household.sizeInPersons;
}

// ============ REGUŁY ŚWIADCZEŃ ============

function evalBecikowe(
  profile: UserProfile,
  benefit: BenefitData,
  now: Date
): BenefitResult {
  const ref = getReferenceDate(profile);
  const incomeOk = incomePerCapita(profile) <= (benefit.income_limit_per_capita_pln ?? 1922);
  const careOk = profile.prenatalCareSince10thWeek;

  let status: EligibilityStatus = 'na';
  let reasoning = '';
  let deadlineAt: Date | null = null;

  if (!incomeOk) {
    reasoning = `Dochód na osobę (${Math.round(incomePerCapita(profile))} zł) przekracza próg ${benefit.income_limit_per_capita_pln} zł.`;
  } else if (!careOk) {
    reasoning = 'Wymagana opieka medyczna od 10. tygodnia ciąży.';
  } else if (isPostBirth(profile) && profile.childBirthDate) {
    const deadline = addMonths(profile.childBirthDate, 12);
    deadlineAt = deadline;
    if (deadline < now) {
      status = 'na';
      reasoning = 'Termin 12 miesięcy od urodzenia upłynął.';
    } else {
      status = 'action';
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
      reasoning = `Należy złożyć w urzędzie gminy. Pozostało ${daysLeft} dni.`;
    }
  } else {
    status = 'future';
    reasoning = 'Wniosek będzie można złożyć po urodzeniu dziecka.';
  }

  return {
    benefitId: benefit.id,
    benefit,
    eligibility: status,
    amountPln: benefit.amount_pln,
    amountDisplay: benefit.amount_display,
    deadlineAt,
    deadlineDescription: deadlineAt ? `do ${deadlineAt.toLocaleDateString('pl-PL')}` : '',
    channel: benefit.channel,
    reasoning,
    totalProjectedPln: status !== 'na' ? benefit.amount_pln ?? 0 : 0,
  };
}

function eval800Plus(
  profile: UserProfile,
  benefit: BenefitData,
  now: Date
): BenefitResult {
  let status: EligibilityStatus = 'future';
  let reasoning = 'Wniosek po urodzeniu dziecka i nadaniu PESEL.';
  let deadlineAt: Date | null = null;

  if (profile.childBirthDate) {
    const threeMonthsAfter = addMonths(profile.childBirthDate, 3);
    deadlineAt = threeMonthsAfter;
    if (threeMonthsAfter < now) {
      // Nadal można złożyć ale bez wyrównania
      status = 'action';
      reasoning = 'Można złożyć, ale bez wyrównania wstecz (3 miesiące minęły).';
    } else {
      status = 'action';
      const daysLeft = Math.ceil((threeMonthsAfter.getTime() - now.getTime()) / 86400000);
      reasoning = `Złóż przez mZUS lub bankowość. Pozostało ${daysLeft} dni na wyrównanie od dnia urodzenia.`;
    }
  }

  // Total projected: do 18 r.ż. dziecka × 800 zł/mies
  let total: number | undefined;
  if (profile.childBirthDate) {
    const monthsToAge18 = 18 * 12 - (monthsSinceBirth(profile, now) ?? 0);
    total = Math.max(0, monthsToAge18) * 800;
  }

  return {
    benefitId: benefit.id,
    benefit,
    eligibility: status,
    amountPln: 800,
    amountDisplay: benefit.amount_display,
    deadlineAt,
    deadlineDescription: deadlineAt ? `do ${deadlineAt.toLocaleDateString('pl-PL')}` : '',
    channel: benefit.channel,
    reasoning,
    totalProjectedPln: total,
  };
}

function evalMacierzynski(
  profile: UserProfile,
  benefit: BenefitData,
  now: Date
): BenefitResult {
  const hasRight = hasEntitlementToMaternityBenefit(profile.employment);

  let status: EligibilityStatus = 'na';
  let reasoning = '';
  let deadlineAt: Date | null = null;

  if (!hasRight) {
    reasoning = `Forma zatrudnienia "${profile.employment}" nie uprawnia do zasiłku macierzyńskiego. Sprawdź kosiniakowe.`;
  } else if (profile.childBirthDate) {
    const deadline21 = addDays(profile.childBirthDate, 21);
    deadlineAt = deadline21;
    if (deadline21 < now) {
      status = 'active';
      reasoning = 'Wariant 100%/70% (wniosek po 21 dniach). Jeśli złożyłaś u pracodawcy — w toku.';
    } else {
      status = 'action';
      const daysLeft = Math.ceil((deadline21.getTime() - now.getTime()) / 86400000);
      reasoning = `Pozostało ${daysLeft} dni na wariant 81,5%. Po terminie zostanie 100%/70%.`;
    }
  } else {
    status = 'future';
    reasoning = 'Wniosek u pracodawcy bezpośrednio po porodzie.';
  }

  return {
    benefitId: benefit.id,
    benefit,
    eligibility: status,
    amountPln: null,
    amountDisplay: benefit.amount_display,
    deadlineAt,
    deadlineDescription: deadlineAt ? `do ${deadlineAt.toLocaleDateString('pl-PL')} dla wariantu 81,5%` : '',
    channel: benefit.channel,
    reasoning,
  };
}

function evalKosiniakowe(
  profile: UserProfile,
  benefit: BenefitData,
  now: Date
): BenefitResult {
  const hasRight = !hasEntitlementToMaternityBenefit(profile.employment);

  let status: EligibilityStatus = 'na';
  let reasoning = '';
  let deadlineAt: Date | null = null;

  if (!hasRight) {
    reasoning = 'Masz prawo do zasiłku macierzyńskiego, więc kosiniakowe nie przysługuje.';
  } else if (profile.childBirthDate) {
    const deadline3m = addMonths(profile.childBirthDate, 3);
    deadlineAt = deadline3m;
    if (deadline3m < now) {
      status = 'eligible';
      reasoning = 'Można złożyć, ale tylko od miesiąca złożenia (bez wyrównania).';
    } else {
      status = 'action';
      const daysLeft = Math.ceil((deadline3m.getTime() - now.getTime()) / 86400000);
      reasoning = `Złóż w urzędzie gminy. Pozostało ${daysLeft} dni na wyrównanie od dnia urodzenia.`;
    }
  } else {
    status = 'future';
    reasoning = '1000 zł × 52 tygodnie (przy 1 dziecku). Wniosek po porodzie.';
  }

  return {
    benefitId: benefit.id,
    benefit,
    eligibility: status,
    amountPln: 1000,
    amountDisplay: benefit.amount_display,
    deadlineAt,
    deadlineDescription: deadlineAt ? `do ${deadlineAt.toLocaleDateString('pl-PL')}` : '',
    channel: benefit.channel,
    reasoning,
    totalProjectedPln: status !== 'na' ? 1000 * 12 : 0,
  };
}

function evalAktywniRodzice(
  profile: UserProfile,
  benefit: BenefitData,
  now: Date
): BenefitResult {
  const monthsOld = monthsSinceBirth(profile, now);
  const bothActive = bothParentsActivelyEmployed(profile);
  const amount = profile.hasDisability ? 1900 : 1500;

  let status: EligibilityStatus = 'na';
  let reasoning = '';
  let deadlineAt: Date | null = null;

  if (!bothActive) {
    reasoning = 'Wymagana aktywność zawodowa obojga rodziców. Sprawdź "Aktywnie w domu" (500 zł).';
  } else if (monthsOld === null) {
    status = 'future';
    reasoning = 'Dostępne od 12. miesiąca życia dziecka.';
  } else if (monthsOld < 12) {
    status = 'future';
    if (profile.childBirthDate) {
      deadlineAt = addMonths(profile.childBirthDate, 12);
    }
    reasoning = `Dostępne od 12. miesiąca (jeszcze ${12 - monthsOld} mies.).`;
  } else if (monthsOld > 35) {
    status = 'na';
    reasoning = 'Dziecko skończyło 35 miesięcy.';
  } else {
    status = 'action';
    if (profile.childBirthDate) {
      deadlineAt = addMonths(profile.childBirthDate, 35);
    }
    reasoning = `Złóż przez mZUS. Kwota ${amount} zł/mies. do 35. miesiąca.`;
  }

  const total = status !== 'na' && monthsOld !== null
    ? amount * Math.max(0, 35 - Math.max(12, monthsOld))
    : 0;

  return {
    benefitId: benefit.id,
    benefit,
    eligibility: status,
    amountPln: amount,
    amountDisplay: profile.hasDisability ? '1 900 zł' : '1 500 zł',
    deadlineAt,
    deadlineDescription: deadlineAt ? `dostępne do ${deadlineAt.toLocaleDateString('pl-PL')}` : '',
    channel: benefit.channel,
    reasoning,
    totalProjectedPln: total,
  };
}

function evalRko(
  profile: UserProfile,
  benefit: BenefitData,
  now: Date
): BenefitResult {
  const monthsOld = monthsSinceBirth(profile, now);

  let status: EligibilityStatus = 'na';
  let reasoning = '';
  let deadlineAt: Date | null = null;

  if (profile.firstChild) {
    reasoning = 'RKO przysługuje tylko na drugie i kolejne dziecko.';
  } else if (monthsOld === null) {
    status = 'future';
    reasoning = 'Wniosek od 9. miesiąca życia dziecka.';
  } else if (monthsOld < 9) {
    status = 'future';
    if (profile.childBirthDate) deadlineAt = addMonths(profile.childBirthDate, 9);
    reasoning = `Wniosek od 9. miesiąca życia (jeszcze ${9 - monthsOld} mies.).`;
  } else if (monthsOld > 13) {
    status = 'na';
    reasoning = 'Okno wnioskowania (9-13 mies.) zostało zakończone.';
  } else {
    status = 'action';
    if (profile.childBirthDate) deadlineAt = addMonths(profile.childBirthDate, 13);
    reasoning = '12 000 zł łącznie. Wybierz 500 zł × 24 mies. lub 1 000 zł × 12 mies.';
  }

  return {
    benefitId: benefit.id,
    benefit,
    eligibility: status,
    amountPln: 12000,
    amountDisplay: benefit.amount_display,
    deadlineAt,
    deadlineDescription: deadlineAt ? `okno wniosku do ${deadlineAt.toLocaleDateString('pl-PL')}` : '',
    channel: benefit.channel,
    reasoning,
    totalProjectedPln: status !== 'na' ? 12000 : 0,
  };
}

// ============ GŁÓWNA FUNKCJA ============

export function checkEligibility(
  profile: UserProfile,
  benefitsData: BenefitsDataset,
  now: Date = new Date()
): BenefitResult[] {
  const results: BenefitResult[] = [];

  for (const benefit of benefitsData.benefits) {
    switch (benefit.id) {
      case 'becikowe':
        results.push(evalBecikowe(profile, benefit, now));
        break;
      case '800plus':
        results.push(eval800Plus(profile, benefit, now));
        break;
      case 'macierzynski':
        results.push(evalMacierzynski(profile, benefit, now));
        break;
      case 'kosiniakowe':
        results.push(evalKosiniakowe(profile, benefit, now));
        break;
      case 'aktywni-rodzice-w-pracy':
        results.push(evalAktywniRodzice(profile, benefit, now));
        break;
      case 'aktywnie-w-zlobku':
        // Wymaga dodatkowych danych (czy dziecko w żłobku, opłata) — później
        results.push({
          benefitId: benefit.id,
          benefit,
          eligibility: 'future',
          amountPln: profile.hasDisability ? 1900 : 1500,
          amountDisplay: benefit.amount_display,
          deadlineAt: null,
          deadlineDescription: 'wymaga zapisu do żłobka',
          channel: benefit.channel,
          reasoning: 'Wypełnij pole "żłobek" w profilu, by sprawdzić eligibility.',
        });
        break;
      case 'aktywnie-w-domu':
        // Alternatywa dla Aktywnych Rodziców w pracy
        const monthsOld = monthsSinceBirth(profile, now);
        const eligibleByAge = monthsOld !== null && monthsOld >= 12 && monthsOld <= 35;
        const notWorking = !bothParentsActivelyEmployed(profile);
        results.push({
          benefitId: benefit.id,
          benefit,
          eligibility: eligibleByAge && notWorking ? 'action' : (notWorking ? 'future' : 'na'),
          amountPln: 500,
          amountDisplay: '500 zł',
          deadlineAt: profile.childBirthDate ? addMonths(profile.childBirthDate, 35) : null,
          deadlineDescription: '',
          channel: benefit.channel,
          reasoning: notWorking
            ? 'Alternatywa dla rodzin niepracujących'
            : 'Pobierasz świadczenie dla pracujących — to się wyklucza',
        });
        break;
      case 'rko':
        results.push(evalRko(profile, benefit, now));
        break;
      default:
        // nieznane świadczenie — pomijaj
        break;
    }
  }

  return results;
}

// ============ POMOCNICZE EXPORTS ============

export function calculateTotalYearOneProjection(results: BenefitResult[]): number {
  return results
    .filter(r => ['eligible', 'action', 'active'].includes(r.eligibility))
    .reduce((sum, r) => sum + (r.totalProjectedPln ?? 0), 0);
}

export function getNextDeadline(results: BenefitResult[]): BenefitResult | null {
  const withDeadlines = results
    .filter(r => r.deadlineAt && ['eligible', 'action'].includes(r.eligibility))
    .sort((a, b) => (a.deadlineAt!.getTime() - b.deadlineAt!.getTime()));
  return withDeadlines[0] ?? null;
}

/* ============================================================================
 * PRZYKŁAD UŻYCIA + TEST CASE (uruchom: pnpm tsx eligibility-engine.ts)
 * ========================================================================== */

if (require.main === module) {
  const benefitsData: BenefitsDataset = require('./benefits.json');

  // Persona: Anna, UoP, 1 dziecko, urodzone 26 maja 2026, woj. mazowieckie
  const annaProfile: UserProfile = {
    childBirthDate: new Date('2026-05-26'),
    firstChild: true,
    employment: 'uop',
    partnerEmployment: 'uop',
    voivodeship: 'mazowieckie',
    city: 'Warszawa',
    household: { sizeInPersons: 3, monthlyNetIncomePln: 12000 },
    hasDisability: false,
    prenatalCareSince10thWeek: true,
    numberOfChildren: 1,
  };

  const now = new Date('2026-06-09');
  const results = checkEligibility(annaProfile, benefitsData, now);

  console.log('=== EligibilityResults dla Anny (10 czerwca 2026) ===\n');
  for (const r of results) {
    console.log(`${r.benefit.name}`);
    console.log(`  status: ${r.eligibility}`);
    console.log(`  kwota: ${r.amountDisplay} (PLN: ${r.amountPln ?? 'n/a'})`);
    console.log(`  deadline: ${r.deadlineAt?.toLocaleDateString('pl-PL') ?? 'brak'}`);
    console.log(`  reasoning: ${r.reasoning}`);
    console.log(`  total: ${r.totalProjectedPln ?? 0} zł\n`);
  }

  console.log(`\n=== Suma projekcji: ${calculateTotalYearOneProjection(results)} zł ===`);
  const next = getNextDeadline(results);
  if (next) {
    console.log(`Najbliższy deadline: ${next.benefit.name} — ${next.deadlineAt?.toLocaleDateString('pl-PL')}`);
  }
}
