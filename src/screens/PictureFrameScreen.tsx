import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Animated,
  Dimensions,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Colors, Typography, Spacing, Radius, TouchTargets } from '../constants';
import { MemoryRecord, ReminderRecord } from '../db/types';
import { speakCalmly, speakMemory, stopSpeaking } from '../services/speechService';
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from '../services/notificationService';
import { formatDisplayTime } from '../components/ReminderCard';

export interface PictureFrameScreenProps {
  memories: MemoryRecord[];
  reminders: ReminderRecord[];
  onExit: () => void;
  onToggleReminder: (reminder: ReminderRecord) => Promise<void> | void;
  slideDurationSeconds?: number;
}

const DEFAULT_SLIDE_INTERVAL_SEC = 12;
const REMINDER_AUTO_DISMISS_SEC = 60;

export const PictureFrameScreen: React.FC<PictureFrameScreenProps> = ({
  memories,
  reminders,
  onExit,
  onToggleReminder,
  slideDurationSeconds = DEFAULT_SLIDE_INTERVAL_SEC,
}) => {
  // Keep the device screen awake indefinitely while Picture Frame Mode is active
  useKeepAwake();

  // Hide system status bar (time, battery, signal) completely while in Picture Frame Mode
  useEffect(() => {
    RNStatusBar.setHidden(true, 'fade');
    return () => {
      RNStatusBar.setHidden(false, 'fade');
    };
  }, []);

  // Allow dynamic auto-rotation (portrait & landscape) while in Picture Frame Mode
  useEffect(() => {
    const unlock = async () => {
      try {
        await ScreenOrientation.unlockAsync();
      } catch {
        // Safe fallback on web or unsupported environments
      }
    };
    unlock();

    return () => {
      const lock = async () => {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } catch {
          // Safe fallback
        }
      };
      lock();
    };
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');

  // Active voice reminder prompt state
  const [activeReminder, setActiveReminder] = useState<ReminderRecord | null>(null);
  const [reminderSecondsLeft, setReminderSecondsLeft] = useState(REMINDER_AUTO_DISMISS_SEC);
  const reminderTimerRef = useRef<any>(null);
  const lastTriggeredReminderId = useRef<string | null>(null);

  // Cross-fade animation for photos
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const controlsTimeoutRef = useRef<any>(null);

  // Format ambient clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours24 = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
      const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
      setCurrentTimeStr(`${hours12}:${minutesStr} ${ampm}`);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      setCurrentDateStr(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-hide controls after 5 seconds of inactivity
  const showControlsTemporarily = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 5000);
  };

  useEffect(() => {
    showControlsTemporarily();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Slideshow advance timer (only runs when no reminder is active and not paused)
  useEffect(() => {
    if (memories.length <= 1 || isPaused || activeReminder) return;

    const interval = setInterval(() => {
      // Smooth fade transition
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex((prev) => (prev + 1) % memories.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      });
    }, slideDurationSeconds * 1000);

    return () => clearInterval(interval);
  }, [memories.length, isPaused, activeReminder, slideDurationSeconds]);

  // Handle Voice Reminder Trigger
  const triggerVoiceReminder = (reminder: ReminderRecord) => {
    setActiveReminder(reminder);
    setReminderSecondsLeft(REMINDER_AUTO_DISMISS_SEC);
    showControlsTemporarily();

    // Speak reminder aloud via English TTS
    const announcement = `Gentle reminder: ${reminder.title}. ${reminder.spokenMessage}`;
    speakCalmly(announcement);

    // Start 60-second auto-dismiss countdown
    if (reminderTimerRef.current) {
      clearInterval(reminderTimerRef.current);
    }

    let seconds = REMINDER_AUTO_DISMISS_SEC;
    reminderTimerRef.current = setInterval(() => {
      seconds -= 1;
      setReminderSecondsLeft(seconds);
      if (seconds <= 0) {
        clearInterval(reminderTimerRef.current);
        reminderTimerRef.current = null;
        dismissReminder();
      }
    }, 1000);
  };

  const dismissReminder = () => {
    if (reminderTimerRef.current) {
      clearInterval(reminderTimerRef.current);
      reminderTimerRef.current = null;
    }
    setActiveReminder(null);
  };

  const handleAcknowledgeReminder = async () => {
    stopSpeaking();
    if (activeReminder) {
      await onToggleReminder(activeReminder);
    }
    dismissReminder();
  };

  // Schedule Watcher: checks if current time matches any pending routine reminder
  useEffect(() => {
    const checkSchedule = () => {
      if (activeReminder) return;

      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const current24 = `${currentHours}:${currentMinutes}`;

      const matching = reminders.find(
        (r) =>
          r.isEnabled === 1 &&
          !r.isCompletedToday &&
          r.timeOfDay === current24 &&
          lastTriggeredReminderId.current !== `${r.id}_${current24}`
      );

      if (matching) {
        lastTriggeredReminderId.current = `${matching.id}_${current24}`;
        triggerVoiceReminder(matching);
      }
    };

    const interval = setInterval(checkSchedule, 2000);
    return () => clearInterval(interval);
  }, [reminders, activeReminder]);

  // Listen to incoming local notifications
  useEffect(() => {
    const subReceived = addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      const reminderId = data?.reminderId;
      const reminder = reminders.find((r) => r.id === reminderId);
      if (reminder) {
        triggerVoiceReminder(reminder);
      } else if (data?.title || notification.request.content.title) {
        const tempReminder: ReminderRecord = {
          id: (reminderId as string) || `rem_${Date.now()}`,
          title: (data?.title as string) || notification.request.content.title || 'Daily Routine',
          category: (data?.category as any) || 'hydration',
          timeOfDay: (data?.timeOfDay as string) || '12:00',
          spokenMessage:
            (data?.spokenMessage as string) ||
            notification.request.content.body ||
            'Time for your daily routine.',
          repeatDaily: 1,
          isEnabled: 1,
          isCompletedToday: 0,
          lastCompletedDate: null,
          notificationId: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        triggerVoiceReminder(tempReminder);
      }
    });

    const subResponse = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const reminderId = data?.reminderId;
      const reminder = reminders.find((r) => r.id === reminderId);
      if (reminder) {
        triggerVoiceReminder(reminder);
      }
    });

    return () => {
      subReceived.remove();
      subResponse.remove();
      if (reminderTimerRef.current) {
        clearInterval(reminderTimerRef.current);
      }
    };
  }, [reminders]);

  const currentMemory = memories[currentIndex] || null;

  const handleNextPhoto = () => {
    if (memories.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % memories.length);
    showControlsTemporarily();
  };

  const handlePrevPhoto = () => {
    if (memories.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + memories.length) % memories.length);
    showControlsTemporarily();
  };

  const handleSpeakCurrentMemory = () => {
    if (currentMemory) {
      speakCalmly(currentMemory.title);
    }
  };

  const getCategoryEmoji = (category: ReminderRecord['category']) => {
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
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      {/* Background & Main Photo with Cross-Fade */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={showControlsTemporarily}
      >
        {currentMemory ? (
          <Animated.View style={[StyleSheet.absoluteFill, styles.imageContainer, { opacity: fadeAnim }]}>
            {/* Ambient blurred backdrop fills letterbox space seamlessly */}
            <Image
              source={{ uri: currentMemory.localImageUri }}
              style={styles.ambientBlurredBackground}
              resizeMode="cover"
              blurRadius={Platform.OS === 'ios' ? 25 : 12}
            />
            <View style={styles.ambientDarkFilter} />

            {/* Foreground Main Photo: 100% visible, centered, zero cropping */}
            <Image
              source={{ uri: currentMemory.localImageUri }}
              style={styles.centeredPhoto}
              resizeMode="contain"
            />

            {/* Subtle Gradient Shadow at bottom for title legibility */}
            <View style={styles.scrimOverlay} pointerEvents="none" />
          </Animated.View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🖼️</Text>
            <Text style={[Typography.h2, { color: Colors.primary, textAlign: 'center' }]}>
              Memory Lane Picture Frame
            </Text>
            <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }]}>
              Add photos in Caregiver Mode to display them in this slideshow.
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Top Ambient Bar (Always subtle, visible on touch) */}
      <SafeAreaView style={styles.topSafeArea} pointerEvents="box-none">
        <View style={styles.topBar}>
          {/* Clock & Date Orientation Badge */}
          <View style={styles.ambientClockBadge}>
            <Text style={styles.ambientClockText}>{currentTimeStr}</Text>
            <Text style={styles.ambientDateText}>{currentDateStr}</Text>
          </View>

          {/* Discreet Control Buttons */}
          {controlsVisible && (
            <View style={styles.topActionsRow}>
              {currentMemory && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleSpeakCurrentMemory}
                  activeOpacity={0.8}
                  accessibilityLabel="Read current memory story"
                >
                  <Text style={styles.iconButtonText}>🔊</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsPaused((prev) => !prev)}
                activeOpacity={0.8}
                accessibilityLabel={isPaused ? 'Resume auto-play' : 'Pause slideshow'}
              >
                <Text style={styles.iconButtonText}>{isPaused ? '▶️' : '⏸️'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exitButton}
                onPress={onExit}
                activeOpacity={0.8}
                accessibilityLabel="Exit picture frame mode"
              >
                <Text style={styles.exitButtonText}>✕ Exit Frame</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Navigation Chevrons (Visible when controls shown) */}
      {controlsVisible && memories.length > 1 && (
        <View style={styles.chevronsOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.navChevronButton}
            onPress={handlePrevPhoto}
            activeOpacity={0.7}
          >
            <Text style={styles.chevronText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navChevronButton}
            onPress={handleNextPhoto}
            activeOpacity={0.7}
          >
            <Text style={styles.chevronText}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Photo Title Overlay (Only picture title, no tag or description) */}
      {currentMemory && !activeReminder && (
        <View style={styles.bottomCaptionContainer} pointerEvents="box-none">
          <View style={styles.titleCard}>
            <Text style={[Typography.h1, styles.captionTitle]}>
              {currentMemory.isFavorite === 1 ? '⭐ ' : ''}{currentMemory.title}
            </Text>
          </View>
        </View>
      )}

      {/* ========================================================= */}
      {/* ACTIVE SCHEDULED VOICE REMINDER OVERLAY                   */}
      {/* ========================================================= */}
      {activeReminder && (
        <View style={styles.reminderOverlayBackdrop}>
          <View style={styles.reminderPromptCard}>
            {/* Auto-dismiss Countdown Progress Bar */}
            <View style={styles.countdownTrack}>
              <View
                style={[
                  styles.countdownBar,
                  {
                    width: `${Math.round(
                      (reminderSecondsLeft / REMINDER_AUTO_DISMISS_SEC) * 100
                    )}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.reminderHeaderRow}>
              <View style={styles.reminderIconCircle}>
                <Text style={styles.reminderCategoryEmoji}>
                  {getCategoryEmoji(activeReminder.category)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderTimeTag}>
                  ⏰ Scheduled for {formatDisplayTime(activeReminder.timeOfDay)}
                </Text>
                <Text style={[Typography.h1, { color: Colors.primary }]}>
                  {activeReminder.title}
                </Text>
              </View>
            </View>

            {/* Spoken Instruction Box */}
            <View style={styles.reminderInstructionBox}>
              <Text style={[Typography.bodyLarge, styles.reminderInstructionText]}>
                "{activeReminder.spokenMessage}"
              </Text>
            </View>

            <Text style={styles.autoDismissNotice}>
              Auto-returning to photo slideshow in {reminderSecondsLeft}s
            </Text>

            {/* Action Buttons */}
            <View style={styles.reminderActionsRow}>
              <TouchableOpacity
                style={styles.replayVoiceButton}
                onPress={() => speakCalmly(activeReminder.spokenMessage)}
                activeOpacity={0.8}
              >
                <Text style={styles.replayVoiceText}>🔊 Hear Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneActionButton}
                onPress={handleAcknowledgeReminder}
                activeOpacity={0.8}
              >
                <Text style={styles.doneActionText}>✓ Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  ambientBlurredBackground: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.15 }],
  },
  ambientDarkFilter: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  centeredPhoto: {
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  scrimOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  emptyEmoji: {
    fontSize: 54,
    marginBottom: Spacing.md,
  },
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  ambientClockBadge: {
    backgroundColor: 'rgba(15, 23, 19, 0.75)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ambientClockText: {
    ...Typography.bodyMediumBold,
    color: Colors.textInverse,
    fontSize: 18,
  },
  ambientDateText: {
    ...Typography.caption,
    color: '#D2DDD5',
    fontSize: 13,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 19, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconButtonText: {
    fontSize: 20,
  },
  exitButton: {
    backgroundColor: 'rgba(15, 23, 19, 0.85)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  exitButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
    fontSize: 15,
  },
  chevronsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '45%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    zIndex: 5,
  },
  navChevronButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(15, 23, 19, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  chevronText: {
    color: Colors.textInverse,
    fontSize: 32,
    fontWeight: '300',
    marginTop: -4,
  },
  bottomCaptionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 1.2,
    zIndex: 8,
  },
  titleCard: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 23, 19, 0.82)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    maxWidth: '92%',
  },
  captionTitle: {
    color: Colors.textInverse,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  reminderOverlayBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 19, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    zIndex: 50,
  },
  reminderPromptCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.accentWarm,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  countdownTrack: {
    height: 5,
    backgroundColor: Colors.surfaceMuted,
    marginHorizontal: -Spacing.xl,
    marginTop: -Spacing.xl,
    marginBottom: Spacing.lg,
  },
  countdownBar: {
    height: '100%',
    backgroundColor: Colors.accentWarm,
  },
  reminderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  reminderIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentWarmLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.accentWarm,
  },
  reminderCategoryEmoji: {
    fontSize: 32,
  },
  reminderTimeTag: {
    ...Typography.caption,
    color: Colors.accentWarm,
    fontWeight: '700',
    marginBottom: 2,
  },
  reminderInstructionBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accentWarm,
    marginBottom: Spacing.md,
  },
  reminderInstructionText: {
    color: Colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 30,
  },
  autoDismissNotice: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  reminderActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'flex-end',
  },
  replayVoiceButton: {
    flex: 1,
    minHeight: TouchTargets.minHeight,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  replayVoiceText: {
    ...Typography.button,
    color: Colors.primary,
    fontSize: 17,
  },
  doneActionButton: {
    flex: 1.3,
    minHeight: TouchTargets.minHeight,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneActionText: {
    ...Typography.button,
    color: Colors.textInverse,
    fontSize: 18,
    fontWeight: '700',
  },
});
