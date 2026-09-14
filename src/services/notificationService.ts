import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ReminderRecord } from '../db/types';
import { ReminderRepository } from '../db/reminderRepository';

export const REMINDERS_CHANNEL_ID = 'routine_reminders';

/**
 * Configure default foreground and background notification presentation behavior.
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Initialize high-priority Android notification channel for daily care reminders.
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL_ID, {
      name: 'Daily Routine Reminders',
      description: 'Gentle voice and task reminders for daily care routines',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E4D38',
      sound: 'default',
    });
  }
}

/**
 * Check if the user has granted notification permissions.
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

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
  if (Platform.OS === 'web') return false;

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
  if (Platform.OS === 'web') return null;

  try {
    // Cancel any existing notification for this reminder
    if (reminder.notificationId) {
      await cancelReminderNotification(reminder.notificationId);
    }

    // Do not schedule if reminder is disabled
    if (!reminder.isEnabled) {
      return null;
    }

    const { hour, minute } = parseTimeString(reminder.timeOfDay);
    const emoji = getCategoryEmoji(reminder.category);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} ${reminder.title}`,
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

    // Update SQLite database with the active scheduled notificationId
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
  if (Platform.OS === 'web' || !notificationId) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (err) {
    console.warn(`[notificationService] Failed to cancel notification ${notificationId}:`, err);
  }
}

/**
 * Re-schedules all enabled reminders from the local SQLite database.
 * Call this when the app initializes or when routines are updated.
 */
export async function syncAllReminderNotifications(): Promise<number> {
  if (Platform.OS === 'web') return 0;

  try {
    await setupNotificationChannel();
    const hasPermission = await hasNotificationPermissions();
    if (!hasPermission) {
      return 0;
    }

    // Cancel all current scheduled notifications to eliminate orphans
    await Notifications.cancelAllScheduledNotificationsAsync();

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
 * Ideal for immediate verification on physical devices or emulators.
 */
export async function scheduleTestNotification(
  secondsFromNow: number = 5,
  title: string = '⏰ Routine Check: Hydration',
  message: string = 'Time for a fresh glass of water to keep you feeling refreshed.'
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

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
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Subscribe to notification responses (user tapping on notification banner).
 */
export function addNotificationResponseReceivedListener(
  listener: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}
