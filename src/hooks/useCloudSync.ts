/**
 * useCloudSync — synchronizuje dane Zdrowie z Supabase.
 *
 * Strategia:
 * - SIGNED_IN (nowe logowanie): sprawdź czy chmura ma dane
 *   → jeśli tak: pobierz (nowe urządzenie)
 *   → jeśli nie: wypchnij lokalne (migracja gościa)
 * - Zmiana w store: wypchnij po 4 s opóźnienia (debounce)
 * - Przejście w tło: natychmiastowy push
 * - INITIAL_SESSION / TOKEN_REFRESHED: tylko aktualizuj userId, bez pull
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { pushAll, pullAndApply, cloudHasData } from '@/services/sync';
import { useTrackersStore } from '@/stores/trackers';
import { useMedicationsStore } from '@/stores/medications';
import { useNotesStore } from '@/stores/notes';

export function useCloudSync() {
  const userId = useRef<string | null>(null);
  const isPulling = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedulePush = useCallback(() => {
    if (isPulling.current || !userId.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    const uid = userId.current;
    pushTimer.current = setTimeout(() => {
      pushAll(uid).catch(() => {}); // silent fail
    }, 4000);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const handleSignIn = async (uid: string) => {
      isPulling.current = true;
      try {
        const hasCloud = await cloudHasData(uid);
        if (hasCloud) {
          await pullAndApply(uid);
        } else {
          await pushAll(uid);
        }
      } catch {
        // silent fail — dane lokalne są bezpieczne
      } finally {
        isPulling.current = false;
      }
    };

    // Sprawdź aktualną sesję przy montowaniu
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid) userId.current = uid;
      // Nie robimy pull przy INITIAL_SESSION — dane lokalne są aktualne
    });

    // Śledź zmiany auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const uid = session?.user?.id ?? null;

        if (event === 'SIGNED_IN' && uid) {
          userId.current = uid;
          await handleSignIn(uid);
        } else if (event === 'SIGNED_OUT') {
          userId.current = null;
          if (pushTimer.current) clearTimeout(pushTimer.current);
        } else if (uid) {
          // INITIAL_SESSION, TOKEN_REFRESHED itp.
          userId.current = uid;
        }
      },
    );

    // Subskrypcje na zmiany w storach → debounced push
    const unsubTrackers = useTrackersStore.subscribe(schedulePush);
    const unsubMeds = useMedicationsStore.subscribe(schedulePush);
    const unsubNotes = useNotesStore.subscribe(schedulePush);

    // Push przy przejściu w tło
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'background' && userId.current && !isPulling.current) {
        if (pushTimer.current) clearTimeout(pushTimer.current);
        pushAll(userId.current).catch(() => {});
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubTrackers();
      unsubMeds();
      unsubNotes();
      appStateSub.remove();
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [schedulePush]);
}
