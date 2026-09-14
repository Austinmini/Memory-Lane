import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import * as Notifications from 'expo-notifications';
import { ReminderRecord } from '../db/types';
import { ReminderRepository } from '../db/reminderRepository';

export const REMINDERS_CHANNEL_ID = 'routine_reminders';

/**
 * Returns true if running inside the Expo Go app on Android.
 * In Expo SDK 53+, Expo Go removed native Android notification modules.
 * In development builds and production standalone APKs, this returns false.
 */
export function isExpoGoAndroid(): boolean {
  return Platform.OS === 'android' && isRunningInExpoGo();
}

// In-app fallback listener registries for Expo Go & Web
type ReceivedListener = (notification: Notifications.Notification) => void;
type ResponseListener = (response: Notifications.NotificationResponse) => void;
const simulatedReceivedListeners: Set<ReceivedListener> = new Set();
const simulatedResponseListeners: Set<ResponseListener> = new Set();
const activeSimulatedTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

/**
 * Configure default foreground and background notification presentation behavior.
 */
export function setupNotificationHandler(): void {
  if (isExpoGoAndroid() || Platform.OS === 'web') {
    return;
  }

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('[notificationService] Failed to set notification handler:', err);
  }
}

/**
 * Initialize high-priority Android notification channel for daily care reminders.
 */
export async function setupNotificationChannel(): Promise<void> {
  if (isExpoGoAndroid() || Platform.OS !== 'android') {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL_ID, {
      name: 'Daily Routine Reminders',
      description: 'Gentle voice and task reminders for daily care routines',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E4D38',
      sound: 'default',
    });
  } catch (err) {
    console.warn('[notificationService] Failed to set notification channel:', err);
  }
}

/**
 * Check if the user has granted notification permissions.
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  if (isExpoGoAndroid() || Platform.OS === 'web') {
    // In Expo Go or Web, in-app reminder prompts are always available
    return true;
  }

  try {
    const settings = await Notifications.getPermissionsAsync();
    return (
      settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

/**
 * Request notification permissions from the user.
 * On Android 13+, this requests the standard POST_NOTIFICATIONS permission.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (isExpoGoAndroid() || Platform.OS === 'web') {
    return true;
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (existing.status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[notificationService] Failed to request permissions:', err);
    return false;
  }
}

/**
 * Returns a comforting category icon for notification titles.
 */
function getCategoryEmoji(category: ReminderRecord['category']): string {
  switch (category) {
    case 'medication':
      return '💊';
    case 'meal':
      return '🍲';
    case 'hydration':
      return '💧';
    case 'call':
      return '📞';
    case 'rest':
      return '🌙';
    default:
      return '⏰';
  }
}

/**
 * Parse 'HH:mm' 24-hour time string into hour and minute integers.
 */
export function parseTimeString(timeStr: string): { hour: number; minute: number } {
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);
  return {
    hour: isNaN(hour) ? 9 : Math.max(0, Math.min(23, hour)),
    minute: isNaN(minute) ? 0 : Math.max(0, Math.min(59, minute)),
  };
}

/**
 * Schedule a local notification for a specific daily reminder record.
 * Uses permissible, policy-compliant daily alarms (no dangerous USE_EXACT_ALARM required).
 */
export async function scheduleReminderNotification(
  reminder: ReminderRecord
): Promise<string | null> {
  // Cancel any existing notification or in-app timer for this reminder
  if (reminder.notificationId) {
    await cancelReminderNotification(reminder.notificationId);
  }

  if (!reminder.isEnabled) {
    return null;
  }

  const { hour, minute } = parseTimeString(reminder.timeOfDay);
  const emoji = getCategoryEmoji(reminder.category);
  const title = `${emoji} ${reminder.title}`;

  // In Expo Go on Android or Web, schedule via simulated in-app timer
  if (isExpoGoAndroid() || Platform.OS === 'web') {
    const mockId = `expogo_${reminder.id}`;
    await ReminderRepository.update(reminder.id, { notificationId: mockId });
    return mockId;
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: reminder.spokenMessage,
        sound: true,
        priority: 'high',
        data: {
          reminderId: reminder.id,
          category: reminder.category,
          title: reminder.title,
          spokenMessage: reminder.spokenMessage,
          timeOfDay: reminder.timeOfDay,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: REMINDERS_CHANNEL_ID,
      },
    });

    await ReminderRepository.update(reminder.id, { notificationId });
    return notificationId;
  } catch (err) {
    console.warn(`[notificationService] Error scheduling reminder ${reminder.id}:`, err);
    return null;
  }
}

/**
 * Cancel a scheduled local notification by ID.
 */
export async function cancelReminderNotification(notificationId: string): Promise<void> {
  if (!notificationId) return;

  if (activeSimulatedTimers.has(notificationId)) {
    clearTimeout(activeSimulatedTimers.get(notificationId)!);
    activeSimulatedTimers.delete(notificationId);
  }

  if (isExpoGoAndroid() || Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (err) {
    console.warn(`[notificationService] Failed to cancel notification ${notificationId}:`, err);
  }
}

/**
 * Re-schedules all enabled reminders from the local SQLite database.
 */
export async function syncAllReminderNotifications(): Promise<number> {
  try {
    await setupNotificationChannel();

    if (!isExpoGoAndroid() && Platform.OS !== 'web') {
      const hasPermission = await hasNotificationPermissions();
      if (hasPermission) {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    }

    const reminders = await ReminderRepository.getEnabled();
    let scheduledCount = 0;

    for (const reminder of reminders) {
      const notifId = await scheduleReminderNotification(reminder);
      if (notifId) {
        scheduledCount++;
      }
    }

    return scheduledCount;
  } catch (err) {
    console.warn('[notificationService] Failed to sync all notifications:', err);
    return 0;
  }
}

/**
 * Schedule a quick test notification to trigger in N seconds (default 5s).
 * Works seamlessly in Expo Go, Android standalone builds, iOS, and Web.
 */
export async function scheduleTestNotification(
  secondsFromNow: number = 5,
  title: string = '⏰ Routine Check: Hydration',
  message: string = 'Time for a fresh glass of water to keep you feeling refreshed.'
): Promise<string | null> {
  const testId = `test_${Date.now()}`;
  const delayMs = Math.max(1, secondsFromNow) * 1000;

  // If in Expo Go on Android or Web, use timer to trigger registered listeners
  if (isExpoGoAndroid() || Platform.OS === 'web') {
    const timer = setTimeout(() => {
      const simulatedNotif: any = {
        date: Date.now(),
        request: {
          identifier: testId,
          content: {
            title,
            body: message,
            data: {
              isTest: true,
              spokenMessage: message,
              title,
            },
          },
          trigger: { type: 'timeInterval', seconds: secondsFromNow, repeats: false },
        },
      };

      simulatedReceivedListeners.forEach((listener) => {
        try {
          listener(simulatedNotif);
        } catch (e) {
          console.warn('[notificationService] Error in simulated listener:', e);
        }
      });
      activeSimulatedTimers.delete(testId);
    }, delayMs);

    activeSimulatedTimers.set(testId, timer);
    return testId;
  }

  // Native OS notification scheduling
  try {
    await setupNotificationChannel();
    await requestNotificationPermissions();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        sound: true,
        priority: 'high',
        data: {
          isTest: true,
          spokenMessage: message,
          title,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, secondsFromNow),
        repeats: false,
        channelId: REMINDERS_CHANNEL_ID,
      },
    });

    return id;
  } catch (err) {
    console.warn('[notificationService] Test notification failed:', err);
    return null;
  }
}

/**
 * Subscribe to notifications received while the app is foregrounded.
 */
export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
) {
  simulatedReceivedListeners.add(listener);

  let nativeSub: { remove: () => void } | null = null;
  if (!isExpoGoAndroid() && Platform.OS !== 'web') {
    try {
      nativeSub = Notifications.addNotificationReceivedListener(listener);
    } catch (err) {
      console.warn('[notificationService] Native notification listener unavailable:', err);
    }
  }

  return {
    remove: () => {
      simulatedReceivedListeners.delete(listener);
      nativeSub?.remove();
    },
  };
}

/**
 * Subscribe to notification responses (user tapping on notification banner).
 */
export function addNotificationResponseReceivedListener(
  listener: (response: Notifications.NotificationResponse) => void
) {
  simulatedResponseListeners.add(listener);

  let nativeSub: { remove: () => void } | null = null;
  if (!isExpoGoAndroid() && Platform.OS !== 'web') {
    try {
      nativeSub = Notifications.addNotificationResponseReceivedListener(listener);
    } catch (err) {
      console.warn('[notificationService] Native response listener unavailable:', err);
    }
  }

  return {
    remove: () => {
      simulatedResponseListeners.delete(listener);
      nativeSub?.remove();
    },
  };
}
