/**
 * ListaScreen.tsx — checklisty kontekstowe per etap.
 *
 * 6 checklist: USC, Praca/ZUS, NFZ POZ, mObywatel, Pediatra, Torba do szpitala.
 * Każda się aktywuje na podstawie etapu (timeline-generator).
 * Stan lokalnie (AsyncStorage w Expo Go, MMKV w buildzie natywnym).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { differenceInDays } from 'date-fns';
import { useRouter, useNavigation } from 'expo-router';

import { createNamedStringStorage } from '@/storage/local-storage';

import { Card, Icon, Checkbox, Progress } from '@/components/ui';
import { MainScreenShell } from '@/components/layout/MainScreenShell';
import { useProfileStore } from '@/stores/profile';
import { colors } from '@/theme/tokens';

// ============ DEFINICJA CHECKLIST ============

interface ChecklistDef {
  id: string;
  title: string;
  note: string;
  // Warunek aktywacji (na podstawie dni od porodu)
  activeFrom: number;    // null = od początku
  activeUntil: number;
  items: { id: string; t: string }[];
}

const CHECKLISTS: ChecklistDef[] = [
  {
    id: 'badania_t1',
    title: 'Badania I trymestru',
    note: 'do 14. tygodnia ciąży',
    activeFrom: -280, activeUntil: 0,
    items: [
      { id: '1', t: 'Morfologia krwi z rozmazem' },
      { id: '2', t: 'Grupa krwi i czynnik Rh' },
      { id: '3', t: 'Badania serologiczne: kiła (VDRL), HIV, WZW B (HBsAg), WZW C (anty-HCV)' },
      { id: '4', t: 'Antygen HBs (WZW B) — do 10. t.c.' },
      { id: '5', t: 'Ferrytyna (zapasy żelaza) — do 10. t.c.' },
      { id: '6', t: 'TSH (tarczyca)' },
      { id: '7', t: 'Ogólne badanie moczu + posiew' },
      { id: '8', t: 'Glukoza na czczo' },
      { id: '9', t: 'USG I trymestru (11–14 t.c.) + ocena ryzyka T21/T18/T13' },
      { id: '10', t: 'Badanie cytologiczne szyjki macicy (jeśli nie wykonane w ostatnich 3 latach)' },
      { id: '11', t: 'Toksoplazmoza IgG/IgM (jeśli wynik nieznany)' },
    ],
  },
  {
    id: 'badania_t2',
    title: 'Badania II trymestru',
    note: '14–28. tydzień ciąży',
    activeFrom: -280, activeUntil: 0,
    items: [
      { id: '1', t: 'USG połówkowe (18–22 t.c.) — pełna ocena anatomii płodu' },
      { id: '2', t: 'Morfologia krwi' },
      { id: '3', t: 'Ogólne badanie moczu' },
      { id: '4', t: 'OGTT 75 g — doustny test obciążenia glukozą (24–28 t.c.)' },
      { id: '5', t: 'Toksoplazmoza — kontrolna serologia (jeśli nieodporna)' },
      { id: '6', t: 'Pomiar ciśnienia tętniczego (przy każdej wizycie)' },
    ],
  },
  {
    id: 'badania_t3',
    title: 'Badania III trymestru',
    note: '28–40. tydzień ciąży',
    activeFrom: -280, activeUntil: 0,
    items: [
      { id: '1', t: 'USG III trymestru (28–32 t.c.) — ocena płodu, łożyska, płynu owodniowego' },
      { id: '2', t: 'Morfologia krwi' },
      { id: '3', t: 'Ogólne badanie moczu + posiew' },
      { id: '4', t: 'Posiew GBS (wymazik z pochwy i odbytu) — 35–37. t.c.' },
      { id: '5', t: 'KTG (kardiotokografia) — od 36. t.c. lub wcześniej przy wskazaniach' },
      { id: '6', t: 'Badanie koagulologiczne (PT, APTT) — przed planowanym porodem' },
      { id: '7', t: 'Konsultacja anestezjologiczna (33–37 t.c.) — jeśli planujesz znieczulenie' },
      { id: '8', t: 'Pomiar ciśnienia tętniczego (przy każdej wizycie)' },
    ],
  },
  {
    id: 'przygotowania_t3',
    title: 'Przygotowanie do porodu',
    note: '28–36. tydzień ciąży',
    activeFrom: -98, activeUntil: -28,
    items: [
      { id: '1', t: 'Szkoła rodzenia — zapisz się do 28. t.c.' },
      { id: '2', t: 'Wybór szpitala i zaplanowanie porodu' },
      { id: '3', t: 'Plan porodu — przygotuj i omów z położną / lekarzem prowadzącym' },
      { id: '4', t: 'Edukacja przedporodowa u położnej POZ (możliwa od początku ciąży)' },
    ],
  },
  {
    id: 'torba',
    title: 'Torba do szpitala',
    note: 'gotowa od 34–36. tygodnia',
    activeFrom: -56, activeUntil: 0,
    items: [
      { id: 'd1', t: 'DOKUMENTY: dowód tożsamości mamy' },
      { id: 'd2', t: 'DOKUMENTY: karta ciąży i wyniki badań' },
      { id: 'd3', t: 'DOKUMENTY: plan porodu (opcjonalnie)' },
      { id: 'm1', t: 'MAMA (poród): luźna koszula porodowa lub koszulka' },
      { id: 'm2', t: 'MAMA (poród): klapki pod prysznic + ciepłe skarpetki' },
      { id: 'm3', t: 'MAMA (poród): gumka do włosów, balsam do ust, woda z dzióbkiem' },
      { id: 'm4', t: 'MAMA (pobyt): 2–3 koszule nocne lub luźne koszulki' },
      { id: 'm5', t: 'MAMA (pobyt): szlafrok, majtki poporodowe' },
      { id: 'm6', t: 'MAMA (pobyt): biustonosz do karmienia + wkładki laktacyjne' },
      { id: 'm7', t: 'MAMA (pobyt): ręczniki, kosmetyczka, ładowarka' },
      { id: 'm8', t: 'MAMA (pobyt): podkłady i podpaski poporodowe' },
      { id: 'c1', t: 'DZIECKO: 3–4 body roz. 56 lub 62 (wcześniej wyprane)' },
      { id: 'c2', t: 'DZIECKO: 3–4 pajacyki lub śpiochy' },
      { id: 'c3', t: 'DZIECKO: czapeczka, skarpetki, kocyk lub rożek' },
      { id: 'c4', t: 'DZIECKO: pieluszki roz. 0 lub 1 + chusteczki nawilżane' },
      { id: 't1', t: 'TATA: woda, przekąski na kilka godzin' },
      { id: 't2', t: 'TATA: ładowarka + powerbank, bluza na zmianę' },
      { id: 't3', t: 'TATA: szczoteczka do zębów, drobne pieniądze i karta' },
      { id: 'f1', t: 'WYJAZD: fotelik samochodowy zamontowany przed przyjazdem' },
    ],
  },
  {
    id: 'usc',
    title: 'Rejestracja w USC',
    note: '21 dni od porodu',
    activeFrom: 0, activeUntil: 30,
    items: [
      { id: '1', t: 'Szpital wysyła Kartę Urodzenia do USC (automatycznie, 3 dni)' },
      { id: '2', t: 'Zgłoszenie online przez gov.pl lub mObywatela albo osobiście' },
      { id: '3', t: 'Dowody osobiste obojga rodziców' },
      { id: '4', t: 'Akt małżeństwa (jeśli jesteście małżeństwem)' },
      { id: '5', t: 'Uznanie ojcostwa (jeśli nie małżeństwo — koniecznie przy tej wizycie)' },
      { id: '6', t: 'Odbiór skróconego aktu urodzenia (bezpłatnie)' },
      { id: '7', t: 'PESEL nadany następnego dnia po zgłoszeniu' },
    ],
  },
  {
    id: 'zus',
    title: 'Zgłoszenie u pracodawcy i ZUS',
    note: '7 dni od nadania PESEL',
    activeFrom: 0, activeUntil: 30,
    items: [
      { id: '1', t: 'Druk ZUS ZCNA — zgłoszenie dziecka do ubezpieczenia zdrowotnego' },
      { id: '2', t: 'Termin: 7 dni od dnia gdy dziecko otrzymało PESEL' },
      { id: '3', t: 'Skrócony odpis aktu urodzenia dla pracodawcy' },
      { id: '4', t: 'Wniosek o urlop macierzyński (wariant 81,5% — złóż w 21 dni od porodu)' },
      { id: '5', t: 'Decyzja: 100%/70% oddzielnie czy jednolite 81,5% od razu' },
      { id: '6', t: 'Urlop ojcowski 2 tygodnie — złóż wniosek do 12. miesiąca dziecka' },
    ],
  },
  {
    id: 'nfz',
    title: 'Lekarz POZ dla dziecka',
    note: 'po nadaniu PESEL',
    activeFrom: 7, activeUntil: 60,
    items: [
      { id: '1', t: 'Wybór lekarza POZ (deklaracja)' },
      { id: '2', t: 'Wybór pielęgniarki POZ' },
      { id: '3', t: 'Wybór położnej POZ (wizyty patronażowe)' },
    ],
  },
  {
    id: 'mobywatel',
    title: 'Dopisanie do mObywatela',
    note: 'po nadaniu PESEL',
    activeFrom: 7, activeUntil: 90,
    items: [
      { id: '1', t: 'Zaloguj się do mObywatela' },
      { id: '2', t: 'Profil dziecka → dodaj PESEL' },
      { id: '3', t: 'Sprawdź historię szczepień i bilansów' },
    ],
  },
  {
    id: 'pediatra',
    title: 'Pierwsza wizyta u pediatry',
    note: 'pierwszy bilans',
    activeFrom: 14, activeUntil: 90,
    items: [
      { id: '1', t: 'Karta zdrowia dziecka ze szpitala' },
      { id: '2', t: 'Pierwszy bilans (1-2 mies.)' },
      { id: '3', t: 'Plan szczepień obowiązkowych' },
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

// ============ KOMPONENT ============

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
  const [state, setState] = useState<ChecklistState>({});
  // Karty zaczynają rozwinięte — użytkownik może zwinąć ręcznie
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(
    () => Object.fromEntries(CHECKLISTS.map((cl) => [cl.id, true])),
  );

  useEffect(() => {
    void loadState().then(setState);
  }, []);

  // Aktywne checklisty na bazie etapu
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
        // Po terminie ale niedokończone — pokazuj w aktywnych z badge'em
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
              Badania
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      ) : (
        <View className="px-5 pt-3 pb-5">
          <Text className="font-serif text-[28px] text-ink leading-tight">Badania</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={{ paddingBottom: showBack ? 40 : 120 }}>

        {active.length > 0 && (
          <View className="px-5 gap-2.5">
            {active.map((cl) => (
              <ChecklistCard
                key={cl.id}
                def={cl}
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
              Zakończone ({completed.length})
            </Text>
            <View className="gap-2.5">
              {completed.map((cl) => (
                <ChecklistCard
                  key={cl.id}
                  def={cl}
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
              Brak aktywnych list
            </Text>
            <Text className="text-ink-soft text-[13px] text-center leading-snug">
              Uzupełnij termin porodu w profilu — listy pojawią się automatycznie dla Twojego etapu ciąży.
            </Text>
          </View>
        )}
      </ScrollView>
    </MainScreenShell>
  );
}

function ChecklistCard({
  def, state, open, onToggleOpen, onToggleItem, muted,
}: {
  def: ChecklistDef;
  state: { [itemId: string]: boolean };
  open: boolean;
  onToggleOpen: () => void;
  onToggleItem: (itemId: string) => void;
  muted?: boolean;
}) {
  const doneCount = def.items.filter((it) => state[it.id]).length;
  const pct = (doneCount / def.items.length) * 100;
  const allDone = doneCount === def.items.length;

  return (
    <View className={`bg-surface border border-line rounded-card overflow-hidden ${muted ? 'opacity-60' : ''}`}>
      <Pressable onPress={onToggleOpen} className="p-4 active:opacity-80">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-ink font-sans-medium text-[15px]">{def.title}</Text>
            <Text className="text-ink-soft text-[12px] mt-0.5">{def.note}</Text>
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
            return (
              <Pressable
                key={item.id}
                onPress={() => onToggleItem(item.id)}
                className="flex-row items-center gap-3 px-4 py-3 active:bg-cream"
              >
                <Checkbox checked={checked} size={20} />
                <Text className={`text-[14px] flex-1 ${checked ? 'text-ink-faint line-through' : 'text-ink'}`}>
                  {item.t}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
