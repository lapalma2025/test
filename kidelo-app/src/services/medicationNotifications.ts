/**
 * Powiadomienia dla leków — działają jak budzik: ekran zgaszony, wibracja, dźwięk.
 * Wymaga uprawnień — wywołaj requestMedNotifPermissions() przy starcie.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Linking } from 'react-native';
import type { MedType, Medication, MedScheduleItem, NotifPrefs } from '@/stores/medications';

const CHANNEL_FULL   = 'medications_full';
const CHANNEL_SILENT = 'medications_silent';

function getMedTitle(type: MedType): string {
  switch (type) {
    case 'pregnancy_vitamin': return '🤰 Czas na witaminy';
    case 'child_med':         return '🍼 Lek dla dziecka';
    case 'insulin':           return '🧪 Czas na insulinę';
    case 'prescription':      return '🩺 Przypomnienie o leku';
    default:                  return '💊 Przypomnienie o suplemencie';
  }
}

// ─── UPRAWNIENIA ──────────────────────────────────────────────────────────────

export async function requestMedNotifPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Na Androidzie 12 (API 31) system wymaga osobnego zezwolenia na dokładne alarmy.
 * Bez tego powiadomienie może być opóźnione przez tryb Doze nawet o kilka godzin.
 * Zwraca true gdy wszystko OK, false gdy użytkownik musi wejść do ustawień.
 */
export async function checkExactAlarmPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    // canScheduleExactNotificationsAsync() dostępne od expo-notifications 0.29
    const can = await (Notifications as any).canScheduleExactNotificationsAsync?.();
    return can !== false; // jeśli funkcja nie istnieje (starsze SDK), zakładamy OK
  } catch {
    return true;
  }
}

/** Otwiera ekran ustawień systemu "Alarmy i przypomnienia" (Android 12+). */
export function openExactAlarmSettings(): void {
  try {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  } catch {}
}

// ─── KANAŁY ANDROID ───────────────────────────────────────────────────────────

async function ensureChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    // MAX importance + bypassDnd = zachowanie identyczne z budzikiem
    await Notifications.setNotificationChannelAsync(CHANNEL_FULL, {
      name: 'Leki — dźwięk i wibracja',
      importance: Notifications.AndroidImportance.MAX,
      enableVibrate: true,
      vibrationPattern: [0, 400, 200, 400],
      sound: 'default',
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      showBadge: true,
    });
    await Notifications.setNotificationChannelAsync(CHANNEL_SILENT, {
      name: 'Leki — tylko powiadomienie',
      importance: Notifications.AndroidImportance.DEFAULT,
      enableVibrate: false,
      vibrationPattern: [],
      sound: null,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: true,
    });
  } catch {}
}

function pickChannel(prefs: NotifPrefs): string {
  return prefs.sound || prefs.vibration ? CHANNEL_FULL : CHANNEL_SILENT;
}

// ─── PLANOWANIE ───────────────────────────────────────────────────────────────

export async function scheduleMedNotifications(
  med: Medication,
  prefs: NotifPrefs = { sound: true, vibration: true },
): Promise<string[]> {
  try {
    await ensureChannels();
    const channelId = pickChannel(prefs);
    const ids: string[] = [];

    for (const item of med.schedule) {
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: getMedTitle(med.type),
            body: `${med.name} — ${item.dosage}`,
            sound: prefs.sound ? 'default' : null,
            data: { type: 'medication', medicationId: med.id, scheduleItemId: item.id },
            ...(Platform.OS === 'android' && prefs.vibration
              ? { vibrate: [0, 400, 200, 400] }
              : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: item.hour,
            minute: item.minute,
            channelId,
          },
        });
        ids.push(id);
      } catch {}
    }
    return ids;
  } catch {
    return [];
  }
}

export async function cancelMedNotifications(notificationIds: string[]): Promise<void> {
  if (notificationIds.length === 0) return;
  try {
    for (const id of notificationIds) {
      try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
    }
  } catch {}
}

export async function snoozeMedNotification(
  med: Medication,
  item: MedScheduleItem,
  prefs: NotifPrefs = { sound: true, vibration: true },
): Promise<void> {
  try {
    await ensureChannels();
    const snoozeAt = new Date(Date.now() + 15 * 60 * 1000);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: getMedTitle(med.type),
        body: `${med.name} — ${item.dosage} (przypomnij)`,
        sound: prefs.sound ? 'default' : null,
        ...(Platform.OS === 'android' && prefs.vibration
          ? { vibrate: [0, 400, 200, 400] }
          : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: snoozeAt,
        channelId: pickChannel(prefs),
      },
    });
  } catch {}
}

export async function rescheduleAllMedNotifications(
  medications: Medication[],
  prefs: NotifPrefs,
  onUpdated: (medicationId: string, ids: string[]) => void,
): Promise<void> {
  for (const med of medications) {
    if (med.notificationIds.length > 0) {
      await cancelMedNotifications(med.notificationIds);
    }
    const newIds = await scheduleMedNotifications(med, prefs);
    onUpdated(med.id, newIds);
  }
}
