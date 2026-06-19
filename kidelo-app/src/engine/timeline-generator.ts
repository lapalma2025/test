/**
 * timeline-generator.ts — generuje spersonalizowaną oś czasu rodzicielską.
 *
 * Z profilu usera (data porodu lub planowana, forma zatrudnienia, etap)
 * wylicza konkretne daty dla 8 etapów i zadań w każdym z nich.
 */

import { addDays, addMonths, differenceInDays, differenceInWeeks, format, isAfter, isBefore } from 'date-fns';
import { pl } from 'date-fns/locale';

import type { UserProfile, BenefitResult } from './eligibility-engine';

export type StageId = 't1' | 't2' | 't3' | 'd07' | 'd830' | 'd31180' | 'm612' | 'm1235';

export type TaskTheme = 'sage' | 'sand' | 'clay';

export interface TaskItem {
  id: string;
  theme: TaskTheme;
  icon: string;
  title: string;
  note: string;
  link?: string;
  deadlineAt?: Date;
  urgent?: boolean;
}

export interface TimelineStage {
  id: StageId;
  band: string;
  kicker: string;
  big: string;
  sub: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  isCompleted: boolean;
  hero: TaskItem;
  next: TaskItem[];
  money: { amount: string; caption: string; pln: number };
}

export interface Timeline {
  stages: TimelineStage[];
  currentStageIndex: number;
  referenceDate: Date;       // termin porodu lub data urodzenia
  isPostBirth: boolean;
}

// ============ DEFINICJE ETAPÓW (offsets w dniach od daty porodu) ============

const STAGE_DEFINITIONS: Array<{
  id: StageId;
  band: string;
  kicker: string;
  offsetStartDays: number;   // -280 = 40 tygodni przed porodem
  offsetEndDays: number;
}> = [
  { id: 't1',     band: 'Tydzień 1–13',    kicker: 'pierwszy trymestr',  offsetStartDays: -280, offsetEndDays: -189 },
  { id: 't2',     band: 'Tydzień 14–26',   kicker: 'drugi trymestr',     offsetStartDays: -189, offsetEndDays: -98  },
  { id: 't3',     band: 'Tydzień 27–40',   kicker: 'trzeci trymestr',    offsetStartDays: -98,  offsetEndDays: 0    },
  { id: 'd07',    band: 'Dzień 0–7',       kicker: 'w szpitalu',         offsetStartDays: 0,    offsetEndDays: 7    },
  { id: 'd830',   band: 'Dzień 8–30',      kicker: 'rejestracja',        offsetStartDays: 8,    offsetEndDays: 30   },
  { id: 'd31180', band: 'Dzień 31–180',    kicker: 'pierwsze pół roku',  offsetStartDays: 31,   offsetEndDays: 180  },
  { id: 'm612',   band: '6–12 miesięcy',   kicker: 'druga połowa roku',  offsetStartDays: 181,  offsetEndDays: 365  },
  { id: 'm1235',  band: '12–35 miesięcy',  kicker: 'aktywny rodzic',     offsetStartDays: 366,  offsetEndDays: 1080 },
];

// ============ GŁÓWNA FUNKCJA ============

export function generateTimeline(
  profile: UserProfile,
  benefitResults: BenefitResult[],
  now: Date = new Date()
): Timeline {
  // Punkt odniesienia: data urodzenia jeśli po porodzie, planowana data porodu jeśli przed
  const referenceDate = profile.childBirthDate ?? profile.childDueDate ?? now;
  const isPostBirth = Boolean(profile.childBirthDate);

  const stages: TimelineStage[] = STAGE_DEFINITIONS.map((def) => {
    const startDate = addDays(referenceDate, def.offsetStartDays);
    const endDate = addDays(referenceDate, def.offsetEndDays);
    const isCurrent = !isBefore(now, startDate) && !isAfter(now, endDate);
    const isCompleted = isAfter(now, endDate);

    const big = generateStageBigLabel(def.id, profile, now);
    const sub = generateStageSubLabel(def.id, profile, benefitResults, now);
    const hero = generateStageHero(def.id, profile, benefitResults, now);
    const next = generateStageNext(def.id, profile, benefitResults, now);
    const money = generateStageMoney(def.id, profile, benefitResults, now);

    return {
      id: def.id,
      band: def.band,
      kicker: def.kicker,
      big,
      sub,
      startDate,
      endDate,
      isCurrent,
      isCompleted,
      hero,
      next,
      money,
    };
  });

  const currentStageIndex = Math.max(0, stages.findIndex((s) => s.isCurrent));

  return {
    stages,
    currentStageIndex: currentStageIndex === -1 ? 0 : currentStageIndex,
    referenceDate,
    isPostBirth,
  };
}

// ============ ETIKIETKI ETAPÓW ============

function generateStageBigLabel(stageId: StageId, profile: UserProfile, now: Date): string {
  const ref = profile.childBirthDate ?? profile.childDueDate ?? now;

  if (profile.childBirthDate) {
    const daysOld = differenceInDays(now, profile.childBirthDate);
    if (daysOld < 30) return `${profile.childName ?? 'Dziecko'} ma ${daysOld} dni`;
    const monthsOld = Math.floor(daysOld / 30);
    return `${profile.childName ?? 'Dziecko'} ma ${monthsOld} ${pluralize(monthsOld, 'miesiąc', 'miesiące', 'miesięcy')}`;
  }

  // Przed porodem — liczymy tydzień ciąży
  if (profile.childDueDate) {
    const daysUntilDue = differenceInDays(profile.childDueDate, now);
    const weeksOfPregnancy = 40 - Math.ceil(daysUntilDue / 7);
    return `Tydzień ${Math.max(1, Math.min(40, weeksOfPregnancy))}`;
  }

  return 'Twój etap';
}

function generateStageSubLabel(
  stageId: StageId,
  profile: UserProfile,
  benefitResults: BenefitResult[],
  now: Date
): string {
  const labels: Record<StageId, string> = {
    t1: 'pierwsze badania, potwierdzenie ciąży, wybór lekarza prowadzącego',
    t2: 'czas wybrać szkołę rodzenia (22–29 tydz.) i szpital, USG połówkowe',
    t3: 'pakowanie torby, plan porodu, badanie GBS, przygotowania',
    d07: 'zachowaj dokumenty ze szpitala, pierwsze doby z noworodkiem',
    d830: 'USC (21 dni), ZUS ZCNA (7 dni od PESEL), wniosek 800+',
    d31180: 'wizyty patronażowe, bilanse, szczepienia, pierwsze świadczenia',
    m612: 'decyzja: żłobek, niania czy dom — to decyduje o świadczeniu',
    m1235: 'Aktywny Rodzic 1500 zł/mies., żłobek lub opieka domowa',
  };
  return labels[stageId];
}

// ============ HERO ZADANIA ============

function generateStageHero(
  stageId: StageId,
  profile: UserProfile,
  benefitResults: BenefitResult[],
  now: Date
): TaskItem {
  switch (stageId) {
    case 't1':
      return {
        id: 'hero:t1',
        theme: 'sage',
        icon: 'stethoscope',
        title: 'Wybierz ginekologa prowadzącego',
        note: 'opieka medyczna od 10. tygodnia ciąży to warunek becikowego · morfologia, grupa krwi, TSH — pierwsze badania teraz',
        link: 'task:badania',
      };
    case 't2':
      return {
        id: 'hero:t2',
        theme: 'sand',
        icon: 'school',
        title: 'Zapisz się do szkoły rodzenia',
        note: 'zapisuj się między 22. a 29. tygodniem — miejsca znikają szybko. Kurs trwa 4–8 tygodni, kończy się miesiąc przed porodem',
        link: 'tab:szkoly',
      };
    case 't3':
      return {
        id: 'hero:t3',
        theme: 'clay',
        icon: 'briefcase',
        title: 'Spakuj torbę do szpitala',
        note: 'gotowa od 34–36 tygodnia · dokumenty mamy, ubranka dziecka, torba dla taty',
        link: 'task:torba',
      };
    case 'd07':
      return {
        id: 'hero:d07',
        theme: 'sage',
        icon: 'file',
        title: 'Zachowaj dokumenty ze szpitala',
        note: 'karta urodzenia, karta szczepień, karta uodpornienia',
      };
    case 'd830': {
      const uscDeadline = profile.childBirthDate ? addDays(profile.childBirthDate, 21) : null;
      const daysLeft = uscDeadline ? differenceInDays(uscDeadline, now) : 0;
      return {
        id: 'hero:d830',
        theme: 'clay',
        icon: 'file',
        title: 'Zarejestruj urodzenie w USC',
        note: daysLeft > 0
          ? `zostało ${daysLeft} ${pluralize(daysLeft, 'dzień', 'dni', 'dni')} — termin 21 dni od porodu`
          : 'termin 21 dni od porodu',
        link: 'task:usc',
        urgent: daysLeft > 0 && daysLeft <= 7,
        deadlineAt: uscDeadline ?? undefined,
      };
    }
    case 'd31180': {
      const r = benefitResults.find((b) => b.benefitId === '800plus');
      return {
        id: 'hero:d31180',
        theme: 'clay',
        icon: 'wallet',
        title: 'Pilnuj wniosku o 800+',
        note: r?.reasoning ?? 'złóż w ciągu 3 miesięcy od urodzenia',
        link: 'benefit:800plus',
        deadlineAt: r?.deadlineAt ?? undefined,
      };
    }
    case 'm612':
      return {
        id: 'hero:m612',
        theme: 'sand',
        icon: 'hospital',
        title: 'Zdecyduj: żłobek, niania czy dom',
        note: 'od tego zależy, które świadczenie wybierzesz po 12. miesiącu',
      };
    case 'm1235': {
      const r = benefitResults.find((b) => b.benefitId === 'aktywni-rodzice-w-pracy');
      return {
        id: 'hero:m1235',
        theme: 'clay',
        icon: 'wallet',
        title: 'Złóż wniosek o Aktywnych Rodziców',
        note: r ? `${r.amountDisplay}/mies. ${r.reasoning}` : '1500 zł lub 1900 zł z niepełnosprawnością',
        link: 'benefit:aktywni-rodzice-w-pracy',
      };
    }
  }
}

// ============ ZADANIA "NEXT" ============

function generateStageNext(
  stageId: StageId,
  profile: UserProfile,
  benefitResults: BenefitResult[],
  now: Date
): TaskItem[] {
  switch (stageId) {
    case 'd830':
      return [
        {
          id: 'task:800plus',
          theme: 'clay',
          icon: 'wallet',
          title: 'Złóż wniosek o 800+',
          note: 'przez mZUS lub bankowość · 800 zł/mies.',
          link: 'benefit:800plus',
        },
        {
          id: 'task:becikowe',
          theme: 'clay',
          icon: 'gift',
          title: 'Becikowe — 1000 zł',
          note: 'jeśli spełniasz kryterium dochodowe (1922 zł/os)',
          link: 'benefit:becikowe',
        },
        {
          id: 'task:nfz',
          theme: 'sage',
          icon: 'stethoscope',
          title: 'Deklaracja NFZ dla dziecka',
          note: 'lekarz POZ + położna środowiskowa · wizyty patronażowe są obowiązkowe',
          link: 'task:nfz',
        },
        {
          id: 'task:mobywatel',
          theme: 'clay',
          icon: 'phone',
          title: 'Dopisz dziecko do mObywatela',
          note: 'historia szczepień i bilansów w telefonie · po nadaniu PESEL',
          link: 'task:mobywatel',
        },
      ];
    case 't2':
      return [
        {
          id: 'task:szpital',
          theme: 'sand',
          icon: 'hospital',
          title: 'Wybierz szpital',
          note: 'porównaj 2–3 placówki w okolicy',
          link: 'tab:szkoly',
        },
        {
          id: 'task:usg',
          theme: 'sage',
          icon: 'activity',
          title: 'USG połówkowe',
          note: 'badanie prenatalne 18.–22. tydzień',
        },
        {
          id: 'task:budget',
          theme: 'clay',
          icon: 'wallet',
          title: 'Plan finansowy',
          note: 'sprawdź co Ci przysługuje po porodzie',
          link: 'tab:pieniadze',
        },
      ];
    case 't1':
      return [
        {
          id: 'task:badania',
          theme: 'sage',
          icon: 'stethoscope',
          title: 'Pierwsze badania',
          note: 'morfologia, grupa krwi, USG genetyczne',
        },
        {
          id: 'task:pit',
          theme: 'clay',
          icon: 'file',
          title: 'Sprawdź PIT-2 u pracodawcy',
          note: 'ulga podatkowa, niższy podatek od miesiąca zgłoszenia',
        },
      ];
    case 't3':
      return [
        {
          id: 'task:szpital',
          theme: 'sand',
          icon: 'hospital',
          title: 'Potwierdź wybór szpitala',
          note: 'sprawdź salę porodową, znieczulenie, obecność taty',
          link: 'task:szpital',
        },
        {
          id: 'task:plan',
          theme: 'sage',
          icon: 'heart',
          title: 'Plan porodu',
          note: 'preferencje co do znieczulenia i kontaktu z dzieckiem',
          link: 'task:plan',
        },
      ];
    case 'd07':
      return [
        {
          id: 'task:badania-noworodka',
          theme: 'sage',
          icon: 'activity',
          title: 'Pierwsze badania noworodka',
          note: 'test przesiewowy, pomiar słuchu',
        },
        {
          id: 'task:szczepienia',
          theme: 'sage',
          icon: 'heart',
          title: 'Pierwsze szczepienia',
          note: 'WZW B i BCG w szpitalu',
        },
      ];
    case 'd31180':
      return [
        {
          id: 'task:bilans',
          theme: 'sage',
          icon: 'stethoscope',
          title: 'Bilans i szczepienia',
          note: 'wizyty patronażowe i kalendarz szczepień',
        },
        {
          id: 'task:becikowe-dzwonek',
          theme: 'clay',
          icon: 'wallet',
          title: 'Becikowe — ostatni dzwonek',
          note: 'wniosek do 12. miesiąca życia',
          link: 'benefit:becikowe',
        },
      ];
    case 'm612':
      return [
        {
          id: 'task:zlobek',
          theme: 'sand',
          icon: 'hospital',
          title: 'Zapisy do żłobka',
          note: 'rekrutacja rusza wiosną — sprawdź terminy',
        },
        {
          id: 'task:aktywny-prep',
          theme: 'clay',
          icon: 'wallet',
          title: 'Przygotuj się na Aktywnego Rodzica',
          note: 'świadczenie od 12. miesiąca',
        },
      ];
    case 'm1235':
      return [
        {
          id: 'task:zlobek-finansowanie',
          theme: 'clay',
          icon: 'wallet',
          title: 'Aktywnie w żłobku',
          note: 'do 1500 zł dofinansowania',
          link: 'benefit:aktywnie-w-zlobku',
        },
        {
          id: 'task:bilans-2l',
          theme: 'sage',
          icon: 'activity',
          title: 'Bilans 2-latka',
          note: 'ocena mowy, wzroku i postawy',
        },
      ];
  }
}

// ============ PROJEKCJE FINANSOWE ============

function generateStageMoney(
  stageId: StageId,
  profile: UserProfile,
  benefitResults: BenefitResult[],
  now: Date
): { amount: string; caption: string; pln: number } {
  // Suma wszystkich projektowanych świadczeń aktywnych w tym etapie
  const total = benefitResults
    .filter((r) => ['eligible', 'action', 'active'].includes(r.eligibility))
    .reduce((sum, r) => sum + (r.totalProjectedPln ?? 0), 0);

  const formatted = formatPLN(total);

  if (['m612', 'm1235'].includes(stageId)) {
    const ar = benefitResults.find((b) => b.benefitId === 'aktywni-rodzice-w-pracy');
    if (ar && ar.amountPln) {
      return {
        amount: `do ${formatPLN(ar.amountPln * 24)}`,
        caption: 'rocznie z Aktywnego Rodzica',
        pln: ar.amountPln * 24,
      };
    }
  }

  return {
    amount: formatted,
    caption: 'projekcja świadczeń',
    pln: total,
  };
}

// ============ HELPERS ============

function formatPLN(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(amount);
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
