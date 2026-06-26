/**
 * notifications.ts — Expo Notifications:
 *  - permissions handshake
 *  - planowanie lokalnych przypomnień dla deadline'ów (7 i 1 dzień przed)
 *  - rejestracja push tokenu dla server-side notifications (Etap 5)
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { addDays, isBefore, isAfter } from 'date-fns';

import type { BenefitResult } from '@/engine/eligibility-engine';

// ============ PERMISSIONS ============

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('[notifications] Symulator nie wspiera push');
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync();
    status = requested;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('deadlines', {
      name: 'Terminy świadczeń',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3D5147',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  return status === 'granted';
}

// ============ HARMONOGRAM DEADLINE'ÓW ============

export interface ScheduledReminder {
  benefitId: string;
  notificationId: string;
  fireAt: Date;
}

export async function scheduleDeadlineReminders(
  results: BenefitResult[]
): Promise<ScheduledReminder[]> {
  // Usuwamy tylko powiadomienia o deadline'ach — nie ruszamy powiadomień leków
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) {
    if ((n.content.data as any)?.type === 'deadline') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  const scheduled: ScheduledReminder[] = [];
  const now = new Date();

  for (const result of results) {
    if (!result.deadlineAt) continue;
    if (!['eligible', 'action'].includes(result.eligibility)) continue;
    if (isBefore(result.deadlineAt, now)) continue;

    // Reminder 7 dni przed deadline
    const reminder7 = addDays(result.deadlineAt, -7);
    if (isAfter(reminder7, now)) {
      const id = await scheduleAt(
        reminder7,
        `Termin ${result.benefit.name} za tydzień`,
        result.deadlineDescription || `${result.amountDisplay} — sprawdź szczegóły`
      );
      scheduled.push({ benefitId: result.benefitId, notificationId: id, fireAt: reminder7 });
    }

    // Reminder 1 dzień przed
    const reminder1 = addDays(result.deadlineAt, -1);
    if (isAfter(reminder1, now)) {
      const id = await scheduleAt(
        reminder1,
        `Ostatni dzień: ${result.benefit.name}`,
        result.amountDisplay
      );
      scheduled.push({ benefitId: result.benefitId, notificationId: id, fireAt: reminder1 });
    }
  }

  return scheduled;
}

async function scheduleAt(date: Date, title: string, body: string): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: { type: 'deadline' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: 'deadlines',
    },
  });
}

// ============ PUSH TOKEN (server-side, Etap 5) ============

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  try {
    const projectId =
      // @ts-ignore
      require('expo-constants').default?.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (e) {
    console.warn('[notifications] failed to get push token', e);
    return null;
  }
}
