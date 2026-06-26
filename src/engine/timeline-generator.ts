import { addDays, differenceInDays } from 'date-fns';

import type { UserProfile, BenefitResult } from './eligibility-engine';
import type { Translations } from '@/i18n/pl';

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
  referenceDate: Date;
  isPostBirth: boolean;
}

type TL = Translations['timeline'];

const STAGE_DEFINITIONS: Array<{
  id: StageId;
  bandKey: keyof TL;
  kickerKey: keyof TL;
  offsetStartDays: number;
  offsetEndDays: number;
}> = [
  { id: 't1',     bandKey: 'bandT1',     kickerKey: 'kickerT1',     offsetStartDays: -280, offsetEndDays: -189 },
  { id: 't2',     bandKey: 'bandT2',     kickerKey: 'kickerT2',     offsetStartDays: -189, offsetEndDays: -98  },
  { id: 't3',     bandKey: 'bandT3',     kickerKey: 'kickerT3',     offsetStartDays: -98,  offsetEndDays: 0    },
  { id: 'd07',    bandKey: 'bandD07',    kickerKey: 'kickerD07',    offsetStartDays: 0,    offsetEndDays: 7    },
  { id: 'd830',   bandKey: 'bandD830',   kickerKey: 'kickerD830',   offsetStartDays: 8,    offsetEndDays: 30   },
  { id: 'd31180', bandKey: 'bandD31180', kickerKey: 'kickerD31180', offsetStartDays: 31,   offsetEndDays: 180  },
  { id: 'm612',   bandKey: 'bandM612',   kickerKey: 'kickerM612',   offsetStartDays: 181,  offsetEndDays: 365  },
  { id: 'm1235',  bandKey: 'bandM1235',  kickerKey: 'kickerM1235',  offsetStartDays: 366,  offsetEndDays: 1080 },
];

export function generateTimeline(
  profile: UserProfile,
  benefitResults: BenefitResult[],
  now: Date = new Date(),
  tl: TL,
): Timeline {
  const referenceDate = profile.childBirthDate ?? profile.childDueDate ?? now;
  const isPostBirth = Boolean(profile.childBirthDate);

  const stages: TimelineStage[] = STAGE_DEFINITIONS.map((def) => {
    const startDate = addDays(referenceDate, def.offsetStartDays);
    const endDate = addDays(referenceDate, def.offsetEndDays);
    const isCurrent = now >= startDate && now <= endDate;
    const isCompleted = now > endDate;

    const band = tl[def.bandKey] as string;
    const kicker = tl[def.kickerKey] as string;
    const big = generateStageBigLabel(def.id, profile, now, tl);
    const sub = generateStageSubLabel(def.id, tl);
    const hero = generateStageHero(def.id, profile, benefitResults, now, tl);
    const next = generateStageNext(def.id, profile, benefitResults, now, tl);
    const money = generateStageMoney(def.id, profile, benefitResults, now, tl);

    return {
      id: def.id,
      band,
      kicker,
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

  const currentStageIndex = stages.findIndex((s) => s.isCurrent);

  return {
    stages,
    currentStageIndex: currentStageIndex === -1 ? 0 : currentStageIndex,
    referenceDate,
    isPostBirth,
  };
}

function generateStageBigLabel(stageId: StageId, profile: UserProfile, now: Date, tl: TL): string {
  if (profile.childBirthDate) {
    const daysOld = differenceInDays(now, profile.childBirthDate);
    if (daysOld < 30) {
      return tl.childDaysOld(profile.childName ?? tl.defaultChildName, daysOld);
    }
    const monthsOld = Math.floor(daysOld / 30);
    return tl.childMonthsOld(profile.childName ?? tl.defaultChildName, monthsOld);
  }

  if (profile.childDueDate) {
    const daysUntilDue = differenceInDays(profile.childDueDate, now);
    const weeksOfPregnancy = 40 - Math.ceil(daysUntilDue / 7);
    return tl.pregnancyWeekLabel(Math.max(1, Math.min(40, weeksOfPregnancy)));
  }

  return tl.yourStageLabel;
}

function generateStageSubLabel(stageId: StageId, tl: TL): string {
  const map: Record<StageId, keyof TL> = {
    t1: 'subT1', t2: 'subT2', t3: 'subT3',
    d07: 'subD07', d830: 'subD830', d31180: 'subD31180',
    m612: 'subM612', m1235: 'subM1235',
  };
  return tl[map[stageId]] as string;
}

function generateStageHero(
  stageId: StageId,
  profile: UserProfile,
  benefitResults: BenefitResult[],
  now: Date,
  tl: TL,
): TaskItem {
  switch (stageId) {
    case 't1':
      return {
        id: 'hero:t1',
        theme: 'sage',
        icon: 'stethoscope',
        title: tl.heroT1Title,
        note: tl.heroT1Note,
        link: 'task:badania',
      };
    case 't2':
      return {
        id: 'hero:t2',
        theme: 'sand',
        icon: 'school',
        title: tl.heroT2Title,
        note: tl.heroT2Note,
        link: 'tab:szkoly',
      };
    case 't3':
      return {
        id: 'hero:t3',
        theme: 'clay',
        icon: 'briefcase',
        title: tl.heroT3Title,
        note: tl.heroT3Note,
        link: 'task:torba',
      };
    case 'd07':
      return {
        id: 'hero:d07',
        theme: 'sage',
        icon: 'file',
        title: tl.heroD07Title,
        note: tl.heroD07Note,
      };
    case 'd830': {
      const uscDeadline = profile.childBirthDate ? addDays(profile.childBirthDate, 21) : null;
      const daysLeft = uscDeadline ? differenceInDays(uscDeadline, now) : 0;
      return {
        id: 'hero:d830',
        theme: 'clay',
        icon: 'file',
        title: tl.heroD830Title,
        note: daysLeft > 0 ? tl.heroD830NoteWithDays(daysLeft) : tl.heroD830Note,
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
        title: tl.heroD31180Title,
        note: r?.reasoning ?? tl.heroD31180Fallback,
        link: 'benefit:800plus',
        deadlineAt: r?.deadlineAt ?? undefined,
      };
    }
    case 'm612':
      return {
        id: 'hero:m612',
        theme: 'sand',
        icon: 'hospital',
        title: tl.heroM612Title,
        note: tl.heroM612Note,
      };
    case 'm1235': {
      const r = benefitResults.find((b) => b.benefitId === 'aktywni-rodzice-w-pracy');
      return {
        id: 'hero:m1235',
        theme: 'clay',
        icon: 'wallet',
        title: tl.heroM1235Title,
        note: r ? `${r.amountDisplay}/mies. ${r.reasoning}` : tl.heroM1235Fallback,
        link: 'benefit:aktywni-rodzice-w-pracy',
      };
    }
  }
}

function generateStageNext(
  stageId: StageId,
  profile: UserProfile,
  benefitResults: BenefitResult[],
  now: Date,
  tl: TL,
): TaskItem[] {
  switch (stageId) {
    case 'd830':
      return [
        {
          id: 'task:800plus',
          theme: 'clay',
          icon: 'wallet',
          title: tl.task800plusTitle,
          note: tl.task800plusNote,
          link: 'benefit:800plus',
        },
        {
          id: 'task:becikowe',
          theme: 'clay',
          icon: 'gift',
          title: tl.taskBecikoveTitle,
          note: tl.taskBecikoveNote,
          link: 'benefit:becikowe',
        },
        {
          id: 'task:nfz',
          theme: 'sage',
          icon: 'stethoscope',
          title: tl.taskNfzTitle,
          note: tl.taskNfzNote,
          link: 'task:nfz',
        },
        {
          id: 'task:mobywatel',
          theme: 'clay',
          icon: 'phone',
          title: tl.taskMobywatelTitle,
          note: tl.taskMobywatelNote,
          link: 'task:mobywatel',
        },
      ];
    case 't2':
      return [
        {
          id: 'task:szpital',
          theme: 'sand',
          icon: 'hospital',
          title: tl.taskSzpitalTitle,
          note: tl.taskSzpitalNote,
          link: 'tab:szkoly',
        },
        {
          id: 'task:usg',
          theme: 'sage',
          icon: 'activity',
          title: tl.taskUsgTitle,
          note: tl.taskUsgNote,
        },
        {
          id: 'task:budget',
          theme: 'clay',
          icon: 'wallet',
          title: tl.taskBudgetTitle,
          note: tl.taskBudgetNote,
          link: 'tab:pieniadze',
        },
      ];
    case 't1':
      return [
        {
          id: 'task:badania',
          theme: 'sage',
          icon: 'stethoscope',
          title: tl.taskBadaniaTitle,
          note: tl.taskBadaniaNote,
        },
        {
          id: 'task:pit',
          theme: 'clay',
          icon: 'file',
          title: tl.taskPitTitle,
          note: tl.taskPitNote,
        },
      ];
    case 't3':
      return [
        {
          id: 'task:szpital',
          theme: 'sand',
          icon: 'hospital',
          title: tl.taskSzpitalConfirmTitle,
          note: tl.taskSzpitalConfirmNote,
          link: 'task:szpital',
        },
        {
          id: 'task:plan',
          theme: 'sage',
          icon: 'heart',
          title: tl.taskPlanTitle,
          note: tl.taskPlanNote,
          link: 'task:plan',
        },
      ];
    case 'd07':
      return [
        {
          id: 'task:badania-noworodka',
          theme: 'sage',
          icon: 'activity',
          title: tl.taskBadaniaNowTitle,
          note: tl.taskBadaniaNowNote,
        },
        {
          id: 'task:szczepienia',
          theme: 'sage',
          icon: 'heart',
          title: tl.taskSzczepieniaTitle,
          note: tl.taskSzczepieniaNote,
        },
      ];
    case 'd31180':
      return [
        {
          id: 'task:bilans',
          theme: 'sage',
          icon: 'stethoscope',
          title: tl.taskBilansTitle,
          note: tl.taskBilansNote,
        },
        {
          id: 'task:becikowe-dzwonek',
          theme: 'clay',
          icon: 'wallet',
          title: tl.taskBecikoveLastTitle,
          note: tl.taskBecikoveLastNote,
          link: 'benefit:becikowe',
        },
      ];
    case 'm612':
      return [
        {
          id: 'task:zlobek',
          theme: 'sand',
          icon: 'hospital',
          title: tl.taskZlobokTitle,
          note: tl.taskZlobokNote,
        },
        {
          id: 'task:aktywny-prep',
          theme: 'clay',
          icon: 'wallet',
          title: tl.taskAktywnyPrepTitle,
          note: tl.taskAktywnyPrepNote,
        },
      ];
    case 'm1235':
      return [
        {
          id: 'task:zlobek-finansowanie',
          theme: 'clay',
          icon: 'wallet',
          title: tl.taskZlobokFinTitle,
          note: tl.taskZlobokFinNote,
          link: 'benefit:aktywnie-w-zlobku',
        },
        {
          id: 'task:bilans-2l',
          theme: 'sage',
          icon: 'activity',
          title: tl.taskBilans2lTitle,
          note: tl.taskBilans2lNote,
        },
      ];
  }
}

function generateStageMoney(
  stageId: StageId,
  profile: UserProfile,
  benefitResults: BenefitResult[],
  now: Date,
  tl: TL,
): { amount: string; caption: string; pln: number } {
  const total = benefitResults
    .filter((r) => ['eligible', 'action', 'active'].includes(r.eligibility))
    .reduce((sum, r) => sum + (r.totalProjectedPln ?? 0), 0);

  const formatted = formatPLN(total);

  if (['m612', 'm1235'].includes(stageId)) {
    const ar = benefitResults.find((b) => b.benefitId === 'aktywni-rodzice-w-pracy');
    if (ar && ar.amountPln) {
      return {
        amount: tl.moneyYearlyCap(formatPLN(ar.amountPln * 24)),
        caption: tl.moneyYearlyCaption,
        pln: ar.amountPln * 24,
      };
    }
  }

  return {
    amount: formatted,
    caption: tl.moneyProjectionCaption,
    pln: total,
  };
}

function formatPLN(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(amount);
}
