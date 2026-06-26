import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { differenceInDays } from 'date-fns';
import { useRouter, useNavigation } from 'expo-router';

import { createNamedStringStorage } from '@/storage/local-storage';

import { Card, Icon, Checkbox, Progress } from '@/components/ui';
import { MainScreenShell } from '@/components/layout/MainScreenShell';
import { useProfileStore } from '@/stores/profile';
import { colors } from '@/theme/tokens';
import { useT } from '@/i18n';
import { useLanguageStore } from '@/stores/language';

// ============ CHECKLIST DATA ============

interface ChecklistDef {
  id: string;
  title: { pl: string; en: string };
  note: { pl: string; en: string };
  activeFrom: number;
  activeUntil: number;
  items: { id: string; pl: string; en: string }[];
}

const CHECKLISTS: ChecklistDef[] = [
  {
    id: 'badania_t1',
    title: { pl: 'Badania I trymestru', en: 'First trimester tests' },
    note: { pl: 'do 14. tygodnia ciąży', en: 'by week 14 of pregnancy' },
    activeFrom: -280, activeUntil: 0,
    items: [
      { id: '1', pl: 'Morfologia krwi z rozmazem', en: 'Complete blood count (CBC)' },
      { id: '2', pl: 'Grupa krwi i czynnik Rh', en: 'Blood type and Rh factor' },
      { id: '3', pl: 'Badania serologiczne: kiła (VDRL), HIV, WZW B (HBsAg), WZW C (anty-HCV)', en: 'Serology: syphilis (VDRL), HIV, Hep B (HBsAg), Hep C (anti-HCV)' },
      { id: '4', pl: 'Antygen HBs (WZW B) — do 10. t.c.', en: 'HBsAg (Hepatitis B) — by week 10' },
      { id: '5', pl: 'Ferrytyna (zapasy żelaza) — do 10. t.c.', en: 'Ferritin (iron stores) — by week 10' },
      { id: '6', pl: 'TSH (tarczyca)', en: 'TSH (thyroid)' },
      { id: '7', pl: 'Ogólne badanie moczu + posiew', en: 'Urinalysis + culture' },
      { id: '8', pl: 'Glukoza na czczo', en: 'Fasting blood glucose' },
      { id: '9', pl: 'USG I trymestru (11–14 t.c.) + ocena ryzyka T21/T18/T13', en: 'First trimester ultrasound (weeks 11–14) + T21/T18/T13 risk assessment' },
      { id: '10', pl: 'Badanie cytologiczne szyjki macicy (jeśli nie wykonane w ostatnich 3 latach)', en: 'Cervical smear (if not done in the last 3 years)' },
      { id: '11', pl: 'Toksoplazmoza IgG/IgM (jeśli wynik nieznany)', en: 'Toxoplasmosis IgG/IgM (if status unknown)' },
    ],
  },
  {
    id: 'badania_t2',
    title: { pl: 'Badania II trymestru', en: 'Second trimester tests' },
    note: { pl: '14–28. tydzień ciąży', en: 'weeks 14–28 of pregnancy' },
    activeFrom: -280, activeUntil: 0,
    items: [
      { id: '1', pl: 'USG połówkowe (18–22 t.c.) — pełna ocena anatomii płodu', en: 'Mid-pregnancy scan (weeks 18–22) — full fetal anatomy assessment' },
      { id: '2', pl: 'Morfologia krwi', en: 'Complete blood count' },
      { id: '3', pl: 'Ogólne badanie moczu', en: 'Urinalysis' },
      { id: '4', pl: 'OGTT 75 g — doustny test obciążenia glukozą (24–28 t.c.)', en: 'OGTT 75 g — oral glucose tolerance test (weeks 24–28)' },
      { id: '5', pl: 'Toksoplazmoza — kontrolna serologia (jeśli nieodporna)', en: 'Toxoplasmosis — follow-up serology (if non-immune)' },
      { id: '6', pl: 'Pomiar ciśnienia tętniczego (przy każdej wizycie)', en: 'Blood pressure measurement (at every visit)' },
    ],
  },
  {
    id: 'badania_t3',
    title: { pl: 'Badania III trymestru', en: 'Third trimester tests' },
    note: { pl: '28–40. tydzień ciąży', en: 'weeks 28–40 of pregnancy' },
    activeFrom: -280, activeUntil: 0,
    items: [
      { id: '1', pl: 'USG III trymestru (28–32 t.c.) — ocena płodu, łożyska, płynu owodniowego', en: 'Third trimester scan (weeks 28–32) — fetal growth, placenta, amniotic fluid' },
      { id: '2', pl: 'Morfologia krwi', en: 'Complete blood count' },
      { id: '3', pl: 'Ogólne badanie moczu + posiew', en: 'Urinalysis + culture' },
      { id: '4', pl: 'Posiew GBS (wymazik z pochwy i odbytu) — 35–37. t.c.', en: 'GBS culture (vaginal and rectal swab) — weeks 35–37' },
      { id: '5', pl: 'KTG (kardiotokografia) — od 36. t.c. lub wcześniej przy wskazaniach', en: 'CTG (cardiotocography) — from week 36 or earlier if indicated' },
      { id: '6', pl: 'Badanie koagulologiczne (PT, APTT) — przed planowanym porodem', en: 'Coagulation tests (PT, APTT) — before planned delivery' },
      { id: '7', pl: 'Konsultacja anestezjologiczna (33–37 t.c.) — jeśli planujesz znieczulenie', en: 'Anaesthesia consultation (weeks 33–37) — if planning epidural' },
      { id: '8', pl: 'Pomiar ciśnienia tętniczego (przy każdej wizycie)', en: 'Blood pressure measurement (at every visit)' },
    ],
  },
  {
    id: 'przygotowania_t3',
    title: { pl: 'Przygotowanie do porodu', en: 'Birth preparation' },
    note: { pl: '28–36. tydzień ciąży', en: 'weeks 28–36 of pregnancy' },
    activeFrom: -98, activeUntil: -28,
    items: [
      { id: '1', pl: 'Szkoła rodzenia — zapisz się do 28. t.c.', en: 'Birth school — enrol by week 28' },
      { id: '2', pl: 'Wybór szpitala i zaplanowanie porodu', en: 'Choose hospital and plan birth' },
      { id: '3', pl: 'Plan porodu — przygotuj i omów z położną / lekarzem prowadzącym', en: 'Birth plan — prepare and discuss with midwife / OB-GYN' },
      { id: '4', pl: 'Edukacja przedporodowa u położnej POZ (możliwa od początku ciąży)', en: 'Antenatal education with community midwife (available from early pregnancy)' },
    ],
  },
  {
    id: 'torba',
    title: { pl: 'Torba do szpitala', en: 'Hospital bag' },
    note: { pl: 'gotowa od 34–36. tygodnia', en: 'ready from weeks 34–36' },
    activeFrom: -56, activeUntil: 0,
    items: [
      { id: 'd1', pl: 'DOKUMENTY: dowód tożsamości mamy', en: 'DOCUMENTS: mum\'s ID' },
      { id: 'd2', pl: 'DOKUMENTY: karta ciąży i wyniki badań', en: 'DOCUMENTS: pregnancy notes and test results' },
      { id: 'd3', pl: 'DOKUMENTY: plan porodu (opcjonalnie)', en: 'DOCUMENTS: birth plan (optional)' },
      { id: 'm1', pl: 'MAMA (poród): luźna koszula porodowa lub koszulka', en: 'MUM (labour): loose hospital gown or t-shirt' },
      { id: 'm2', pl: 'MAMA (poród): klapki pod prysznic + ciepłe skarpetki', en: 'MUM (labour): shower flip-flops + warm socks' },
      { id: 'm3', pl: 'MAMA (poród): gumka do włosów, balsam do ust, woda z dzióbkiem', en: 'MUM (labour): hair tie, lip balm, sports water bottle' },
      { id: 'm4', pl: 'MAMA (pobyt): 2–3 koszule nocne lub luźne koszulki', en: 'MUM (stay): 2–3 nightgowns or loose tops' },
      { id: 'm5', pl: 'MAMA (pobyt): szlafrok, majtki poporodowe', en: 'MUM (stay): dressing gown, postnatal underwear' },
      { id: 'm6', pl: 'MAMA (pobyt): biustonosz do karmienia + wkładki laktacyjne', en: 'MUM (stay): nursing bra + breast pads' },
      { id: 'm7', pl: 'MAMA (pobyt): ręczniki, kosmetyczka, ładowarka', en: 'MUM (stay): towels, toiletry bag, phone charger' },
      { id: 'm8', pl: 'MAMA (pobyt): podkłady i podpaski poporodowe', en: 'MUM (stay): maternity pads' },
      { id: 'c1', pl: 'DZIECKO: 3–4 body roz. 56 lub 62 (wcześniej wyprane)', en: 'BABY: 3–4 bodysuits size 56 or 62 (pre-washed)' },
      { id: 'c2', pl: 'DZIECKO: 3–4 pajacyki lub śpiochy', en: 'BABY: 3–4 sleepsuits or babygrows' },
      { id: 'c3', pl: 'DZIECKO: czapeczka, skarpetki, kocyk lub rożek', en: 'BABY: hat, socks, blanket or swaddle' },
      { id: 'c4', pl: 'DZIECKO: pieluszki roz. 0 lub 1 + chusteczki nawilżane', en: 'BABY: nappies size 0 or 1 + wet wipes' },
      { id: 't1', pl: 'TATA: woda, przekąski na kilka godzin', en: 'PARTNER: water, snacks for several hours' },
      { id: 't2', pl: 'TATA: ładowarka + powerbank, bluza na zmianę', en: 'PARTNER: charger + power bank, change of clothes' },
      { id: 't3', pl: 'TATA: szczoteczka do zębów, drobne pieniądze i karta', en: 'PARTNER: toothbrush, cash and bank card' },
      { id: 'f1', pl: 'WYJAZD: fotelik samochodowy zamontowany przed przyjazdem', en: 'LEAVING: car seat fitted before arrival' },
    ],
  },
  {
    id: 'usc',
    title: { pl: 'Rejestracja w USC', en: 'Registry office registration' },
    note: { pl: '21 dni od porodu', en: '21 days after birth' },
    activeFrom: 0, activeUntil: 30,
    items: [
      { id: '1', pl: 'Szpital wysyła Kartę Urodzenia do USC (automatycznie, 3 dni)', en: 'Hospital sends birth notification to registry office (automatic, 3 days)' },
      { id: '2', pl: 'Zgłoszenie online przez gov.pl lub mObywatela albo osobiście', en: 'Register online via gov.pl or mObywatel app, or in person' },
      { id: '3', pl: 'Dowody osobiste obojga rodziców', en: 'Both parents\' ID documents' },
      { id: '4', pl: 'Akt małżeństwa (jeśli jesteście małżeństwem)', en: 'Marriage certificate (if married)' },
      { id: '5', pl: 'Uznanie ojcostwa (jeśli nie małżeństwo — koniecznie przy tej wizycie)', en: 'Paternity acknowledgement (if unmarried — required at this visit)' },
      { id: '6', pl: 'Odbiór skróconego aktu urodzenia (bezpłatnie)', en: 'Receive abbreviated birth certificate (free of charge)' },
      { id: '7', pl: 'PESEL nadany następnego dnia po zgłoszeniu', en: 'PESEL number issued the day after registration' },
    ],
  },
  {
    id: 'zus',
    title: { pl: 'Zgłoszenie u pracodawcy i ZUS', en: 'Employer and ZUS registration' },
    note: { pl: '7 dni od nadania PESEL', en: '7 days after PESEL is issued' },
    activeFrom: 0, activeUntil: 30,
    items: [
      { id: '1', pl: 'Druk ZUS ZCNA — zgłoszenie dziecka do ubezpieczenia zdrowotnego', en: 'ZUS ZCNA form — register child for health insurance' },
      { id: '2', pl: 'Termin: 7 dni od dnia gdy dziecko otrzymało PESEL', en: 'Deadline: 7 days from when the child received their PESEL' },
      { id: '3', pl: 'Skrócony odpis aktu urodzenia dla pracodawcy', en: 'Abbreviated birth certificate for employer' },
      { id: '4', pl: 'Wniosek o urlop macierzyński (wariant 81,5% — złóż w 21 dni od porodu)', en: 'Maternity leave application (81.5% option — submit within 21 days of birth)' },
      { id: '5', pl: 'Decyzja: 100%/70% oddzielnie czy jednolite 81,5% od razu', en: 'Choose: 100%/70% separately or flat 81.5% rate' },
      { id: '6', pl: 'Urlop ojcowski 2 tygodnie — złóż wniosek do 12. miesiąca dziecka', en: '2 weeks\' paternity leave — apply by child\'s 12th month' },
    ],
  },
  {
    id: 'nfz',
    title: { pl: 'Lekarz POZ dla dziecka', en: 'GP registration for child' },
    note: { pl: 'po nadaniu PESEL', en: 'after PESEL is issued' },
    activeFrom: 7, activeUntil: 60,
    items: [
      { id: '1', pl: 'Wybór lekarza POZ (deklaracja)', en: 'Choose a GP (declaration form)' },
      { id: '2', pl: 'Wybór pielęgniarki POZ', en: 'Choose a community nurse' },
      { id: '3', pl: 'Wybór położnej POZ (wizyty patronażowe)', en: 'Choose a community midwife (health visitor appointments)' },
    ],
  },
  {
    id: 'mobywatel',
    title: { pl: 'Dopisanie do mObywatela', en: 'Add to mObywatel app' },
    note: { pl: 'po nadaniu PESEL', en: 'after PESEL is issued' },
    activeFrom: 7, activeUntil: 90,
    items: [
      { id: '1', pl: 'Zaloguj się do mObywatela', en: 'Log in to mObywatel' },
      { id: '2', pl: 'Profil dziecka → dodaj PESEL', en: 'Child profile → add PESEL' },
      { id: '3', pl: 'Sprawdź historię szczepień i bilansów', en: 'Check vaccination and check-up history' },
    ],
  },
  {
    id: 'pediatra',
    title: { pl: 'Pierwsza wizyta u pediatry', en: 'First paediatrician visit' },
    note: { pl: 'pierwszy bilans', en: 'first check-up' },
    activeFrom: 14, activeUntil: 90,
    items: [
      { id: '1', pl: 'Karta zdrowia dziecka ze szpitala', en: 'Child health card from hospital' },
      { id: '2', pl: 'Pierwszy bilans (1-2 mies.)', en: 'First developmental check-up (1–2 months)' },
      { id: '3', pl: 'Plan szczepień obowiązkowych', en: 'Mandatory vaccination schedule' },
    ],
  },
];

// ============ STORAGE ============

const checklistStorage = createNamedStringStorage('kidelo-checklists');

interface ChecklistState {
  [checklistId: string]: { [itemId: string]: boolean };
}

async function loadState(): Promise<ChecklistState> {
  try {
    const raw = await checklistStorage.getString('state');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveState(state: ChecklistState) {
  await checklistStorage.set('state', JSON.stringify(state));
}

// ============ COMPONENT ============

const BACK_BTN = {
  width: 40, height: 40, borderRadius: 12, borderWidth: 0.5,
  borderColor: colors.line.DEFAULT, backgroundColor: colors.surface.DEFAULT,
  alignItems: 'center' as const, justifyContent: 'center' as const,
};

export default function ListaScreen() {
  const router = useRouter();
  const nav = useNavigation();
  const showBack = nav.canGoBack();
  const profile = useProfileStore();
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);
  const [state, setState] = useState<ChecklistState>({});
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(
    () => Object.fromEntries(CHECKLISTS.map((cl) => [cl.id, true])),
  );

  useEffect(() => {
    void loadState().then(setState);
  }, []);

  const { active, completed } = useMemo(() => {
    const ref = profile.childBirthDate || profile.childDueDate;
    const refDate = ref ? new Date(ref) : new Date();
    const now = new Date();
    const daysSinceRef = differenceInDays(now, refDate);

    const active: ChecklistDef[] = [];
    const completed: ChecklistDef[] = [];

    for (const cl of CHECKLISTS) {
      const inWindow = daysSinceRef >= cl.activeFrom && daysSinceRef <= cl.activeUntil;
      const doneCount = cl.items.filter((it) => state[cl.id]?.[it.id]).length;
      const allDone = doneCount === cl.items.length;

      if (allDone) {
        completed.push(cl);
      } else if (inWindow) {
        active.push(cl);
      } else if (daysSinceRef > cl.activeUntil) {
        active.push(cl);
      }
    }

    return { active, completed };
  }, [profile.childBirthDate, profile.childDueDate, state]);

  const toggleItem = (clId: string, itemId: string) => {
    setState((s) => {
      const newState = {
        ...s,
        [clId]: { ...(s[clId] ?? {}), [itemId]: !(s[clId]?.[itemId] ?? false) },
      };
      void saveState(newState);
      return newState;
    });
  };

  const toggleOpen = (id: string) =>
    setOpenIds((o) => ({ ...o, [id]: !o[id] }));

  return (
    <MainScreenShell>
      {showBack ? (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 18, paddingVertical: 14,
        }}>
          <Pressable onPress={() => router.back()} style={BACK_BTN}>
            <Icon name="back" size={20} color={colors.ink.DEFAULT} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
              {t.tests.title}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      ) : (
        <View className="px-5 pt-3 pb-5">
          <Text className="font-serif text-[28px] text-ink leading-tight">{t.tests.title}</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={{ paddingBottom: showBack ? 40 : 120 }}>

        {active.length > 0 && (
          <View className="px-5 gap-2.5">
            {active.map((cl) => (
              <ChecklistCard
                key={cl.id}
                def={cl}
                lang={lang}
                state={state[cl.id] ?? {}}
                open={!!openIds[cl.id]}
                onToggleOpen={() => toggleOpen(cl.id)}
                onToggleItem={(itemId) => toggleItem(cl.id, itemId)}
              />
            ))}
          </View>
        )}

        {completed.length > 0 && (
          <View className="px-5 mt-7">
            <Text className="text-ink-soft text-[12px] font-sans-medium uppercase tracking-wide mb-3">
              {t.tests.completedSection(completed.length)}
            </Text>
            <View className="gap-2.5">
              {completed.map((cl) => (
                <ChecklistCard
                  key={cl.id}
                  def={cl}
                  lang={lang}
                  state={state[cl.id] ?? {}}
                  open={!!openIds[cl.id]}
                  onToggleOpen={() => toggleOpen(cl.id)}
                  onToggleItem={(itemId) => toggleItem(cl.id, itemId)}
                  muted
                />
              ))}
            </View>
          </View>
        )}

        {active.length === 0 && completed.length === 0 && (
          <View className="px-8 mt-8 items-center gap-3">
            <View className="w-16 h-16 bg-sage-soft rounded-full items-center justify-center">
              <Icon name="check" size={28} color={colors.evergreen.DEFAULT} />
            </View>
            <Text className="text-ink font-sans-medium text-[15px] text-center">
              {t.tests.noActive}
            </Text>
            <Text className="text-ink-soft text-[13px] text-center leading-snug">
              {t.tests.noActiveDesc}
            </Text>
          </View>
        )}
      </ScrollView>
    </MainScreenShell>
  );
}

function ChecklistCard({
  def, lang, state, open, onToggleOpen, onToggleItem, muted,
}: {
  def: ChecklistDef;
  lang: string;
  state: { [itemId: string]: boolean };
  open: boolean;
  onToggleOpen: () => void;
  onToggleItem: (itemId: string) => void;
  muted?: boolean;
}) {
  const doneCount = def.items.filter((it) => state[it.id]).length;
  const pct = (doneCount / def.items.length) * 100;

  const title = lang === 'en' ? def.title.en : def.title.pl;
  const note = lang === 'en' ? def.note.en : def.note.pl;

  return (
    <View className={`bg-surface border border-line rounded-card overflow-hidden ${muted ? 'opacity-60' : ''}`}>
      <Pressable onPress={onToggleOpen} className="p-4 active:opacity-80">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-ink font-sans-medium text-[15px]">{title}</Text>
            <Text className="text-ink-soft text-[12px] mt-0.5">{note}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="font-mono text-[13px] text-ink-soft">
              {doneCount}/{def.items.length}
            </Text>
            <Icon name={open ? 'chevronDown' : 'chevron'} size={16} color={colors.ink.faint} />
          </View>
        </View>
        <Progress value={doneCount} max={def.items.length} />
      </Pressable>

      {open && (
        <View className="border-t border-line">
          {def.items.map((item) => {
            const checked = state[item.id] ?? false;
            const itemText = lang === 'en' ? item.en : item.pl;
            return (
              <Pressable
                key={item.id}
                onPress={() => onToggleItem(item.id)}
                className="flex-row items-center gap-3 px-4 py-3 active:bg-cream"
              >
                <Checkbox checked={checked} size={20} />
                <Text className={`text-[14px] flex-1 ${checked ? 'text-ink-faint line-through' : 'text-ink'}`}>
                  {itemText}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
