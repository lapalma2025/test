/**
 * monitoring.ts — Sentry (error tracking) + PostHog (analytics).
 *
 * Włącza się tylko gdy w env podano DSN i klucz analytics.
 * Bez wartości w env: aplikacja działa, ale bez monitoringu.
 */

import Constants from 'expo-constants';

// ============ SENTRY ============

const SENTRY_DSN =
  Constants.expoConfig?.extra?.sentryDsn ?? process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export async function initSentry() {
  if (!SENTRY_DSN) return;

  try {
    // Lazy import — żeby nie powiększać bundle gdy nie używamy
    const Sentry = await import('@sentry/react-native');

    Sentry.init({
      dsn: SENTRY_DSN,
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,
      tracesSampleRate: 0.1,
      environment: __DEV__ ? 'development' : 'production',
      release: Constants.expoConfig?.version ?? '0.1.0',
      // RODO: usuwamy PII automatycznie
      beforeSend(event) {
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        return event;
      },
    });
  } catch (e) {
    console.warn('[sentry] failed to initialize', e);
  }
}

export async function captureError(error: unknown, context?: Record<string, any>) {
  if (!SENTRY_DSN) {
    console.error('[error]', error, context);
    return;
  }
  try {
    const Sentry = await import('@sentry/react-native');
    Sentry.captureException(error, { extra: context });
  } catch {}
}

// ============ POSTHOG (zostawiamy szkielet, Etap 6) ============

const POSTHOG_KEY =
  Constants.expoConfig?.extra?.posthogKey ?? process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';

type EventName =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'benefit_opened'
  | 'benefit_deep_link_clicked'
  | 'school_opened'
  | 'compare_opened'
  | 'task_done'
  | 'profile_reset';

export function trackEvent(name: EventName, properties?: Record<string, any>) {
  if (!POSTHOG_KEY) return;
  if (__DEV__) {
    console.log('[analytics]', name, properties);
    return;
  }
  // TODO Etap 6: PostHog SDK integration (posthog-react-native)
  // posthog.capture(name, properties);
}
