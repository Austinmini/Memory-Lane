import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, TouchTargets } from '../constants';
import { MemoryRecord, ReminderRecord } from '../db/types';
import { HeaderTimeWidget } from '../components/HeaderTimeWidget';
import { MemoryCarousel } from '../components/MemoryCarousel';
import { ReminderCard } from '../components/ReminderCard';
import { CaregiverLockModal } from '../components/CaregiverLockModal';
import { VoicePromptModal } from '../components/VoicePromptModal';
import { speakCalmly, stopSpeaking } from '../services/speechService';

export interface PatientHomeScreenProps {
  memories: MemoryRecord[];
  reminders: ReminderRecord[];
  onToggleReminder: (reminder: ReminderRecord) => Promise<void> | void;
  onOpenCaregiverMode: () => void;
  onRefresh?: () => Promise<void> | void;
  activePromptReminder?: ReminderRecord | null;
  isPromptModalVisible?: boolean;
  onAcknowledgeVoiceModal?: (reminder: ReminderRecord | null) => void;
  onDismissVoiceModal?: () => void;
  onSelectMemoryForView?: (memory: MemoryRecord) => void;
}

export const PatientHomeScreen: React.FC<PatientHomeScreenProps> = ({
  memories,
  reminders,
  onToggleReminder,
  onOpenCaregiverMode,
  onRefresh,
  activePromptReminder = null,
  isPromptModalVisible = false,
  onAcknowledgeVoiceModal,
  onDismissVoiceModal,
  onSelectMemoryForView,
}) => {
  const [isLockModalVisible, setIsLockModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter enabled reminders
  const activeReminders = reminders.filter((r) => r.isEnabled === 1);
  const completedCount = activeReminders.filter((r) => r.isCompletedToday === 1).length;
  const totalCount = activeReminders.length;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  const handlePullRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  const handleSpeakDayOverview = () => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[now.getDay()];
    const remaining = totalCount - completedCount;

    let message = `Hello! Today is ${dayName}. `;
    if (totalCount === 0) {
      message += 'You have no scheduled tasks for today. It is a wonderful day to relax.';
    } else if (isAllCompleted) {
      message += `You have completed all ${totalCount} of your daily routines today. Wonderful job!`;
    } else {
      message += `You have ${remaining} ${remaining === 1 ? 'routine' : 'routines'} remaining today. `;
      const nextPending = activeReminders.find((r) => !r.isCompletedToday);
      if (nextPending) {
        message += `Next up is ${nextPending.title}.`;
      }
    }
    speakCalmly(message);
  };

  const handleUnlockSuccess = () => {
    setIsLockModalVisible(false);
    onOpenCaregiverMode();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handlePullRefresh}
              tintColor={Colors.primary}
            />
          ) : undefined
        }
      >
        {/* Top App Bar with Discreet Caregiver Entry */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Text style={styles.brandEmoji}>🌿</Text>
            <View>
              <Text style={[Typography.h1, { color: Colors.primary }]}>Memory Lane</Text>
              <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
                Daily Companion
              </Text>
            </View>
          </View>

          {/* Discreet Caregiver Mode Access Button (Tap or Long-Press) */}
          <TouchableOpacity
            style={styles.caregiverButton}
            onPress={() => setIsLockModalVisible(true)}
            onLongPress={() => setIsLockModalVisible(true)}
            delayLongPress={600}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open Caregiver Mode (Password Protected)"
          >
            <Text style={styles.caregiverIcon}>🔒</Text>
            <Text style={styles.caregiverButtonText}>Caregiver</Text>
          </TouchableOpacity>
        </View>

        {/* Orientation Header (Time, Day, Date, Greeting) */}
        <View style={styles.widgetWrapper}>
          <HeaderTimeWidget />
        </View>

        {/* Soothing Orientation Voice Button */}
        <TouchableOpacity
          style={styles.orientationVoiceButton}
          onPress={handleSpeakDayOverview}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Read today's schedule out loud"
        >
          <Text style={styles.voiceButtonEmoji}>🔊</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.voiceButtonTitle}>Read Today's Schedule</Text>
            <Text style={styles.voiceButtonSubtitle}>
              Tap to hear what day it is and your routine plan
            </Text>
          </View>
        </TouchableOpacity>

        {/* Section 1: Loved Ones & Memories Carousel */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[Typography.h2, { color: Colors.primary }]}>
            Family & Memories
          </Text>
          <Text style={styles.sectionBadge}>
            {memories.length} {memories.length === 1 ? 'Story' : 'Stories'}
          </Text>
        </View>
        <Text style={[Typography.caption, { color: Colors.textSecondary, marginBottom: Spacing.sm }]}>
          Swipe through photos of loved ones and tap "Read Story" to listen.
        </Text>

        {memories.length > 0 ? (
          <MemoryCarousel
            memories={memories}
            onMemoryPress={onSelectMemoryForView}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={[Typography.h3, { color: Colors.primary, textAlign: 'center' }]}>
              No Memories Added Yet
            </Text>
            <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }]}>
              Your family caregiver can add cherished photos and stories from the Caregiver menu.
            </Text>
          </View>
        )}

        {/* Section 2: Today's Schedule & Routine */}
        <View style={[styles.sectionHeaderRow, { marginTop: Spacing.lg }]}>
          <Text style={[Typography.h2, { color: Colors.primary }]}>
            Today's Routine
          </Text>
          {totalCount > 0 && (
            <View
              style={[
                styles.statusBadge,
                isAllCompleted ? styles.statusBadgeCompleted : styles.statusBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isAllCompleted ? styles.statusBadgeTextCompleted : styles.statusBadgeTextActive,
                ]}
              >
                {completedCount} of {totalCount} Done
              </Text>
            </View>
          )}
        </View>
        <Text style={[Typography.caption, { color: Colors.textSecondary, marginBottom: Spacing.md }]}>
          Tap the checkbox when completed, or tap "Listen" to hear voice guidance.
        </Text>

        {/* All tasks completed celebration card */}
        {isAllCompleted && (
          <View style={styles.celebrationCard}>
            <Text style={styles.celebrationEmoji}>🌟</Text>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.h3, { color: Colors.success }]}>
                Wonderful Job!
              </Text>
              <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: Spacing.xs }]}>
                You have completed all your routines for today. Enjoy a restful and peaceful day!
              </Text>
            </View>
          </View>
        )}

        {/* Routine Cards List */}
        {activeReminders.length > 0 ? (
          activeReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onToggleComplete={onToggleReminder}
              showEditButton={false}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>☀️</Text>
            <Text style={[Typography.h3, { color: Colors.primary, textAlign: 'center' }]}>
              No Routines Scheduled
            </Text>
            <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }]}>
              You have no reminders right now. Enjoy your day!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Caregiver Lock Modal with PIN / Hold */}
      <CaregiverLockModal
        visible={isLockModalVisible}
        onUnlock={handleUnlockSuccess}
        onClose={() => setIsLockModalVisible(false)}
      />

      {/* In-App Voice Prompt Alert Modal (Active when reminder sounds) */}
      <VoicePromptModal
        visible={isPromptModalVisible}
        reminder={activePromptReminder}
        onAcknowledge={onAcknowledgeVoiceModal || (() => {})}
        onDismiss={onDismissVoiceModal || (() => {})}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 1.5,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandEmoji: {
    fontSize: 34,
  },
  caregiverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: TouchTargets.minHeight,
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  caregiverIcon: {
    fontSize: 18,
  },
  caregiverButtonText: {
    ...Typography.button,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  widgetWrapper: {
    marginBottom: Spacing.md,
  },
  orientationVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.primaryMuted,
    minHeight: TouchTargets.minHeight,
    gap: Spacing.md,
  },
  voiceButtonEmoji: {
    fontSize: 30,
  },
  voiceButtonTitle: {
    ...Typography.bodyMediumBold,
    color: Colors.primary,
    fontSize: 18,
  },
  voiceButtonSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  sectionBadge: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: Colors.accentWarmLight,
    borderColor: Colors.accentWarm,
  },
  statusBadgeCompleted: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: Colors.accentWarm,
  },
  statusBadgeTextCompleted: {
    color: Colors.success,
  },
  celebrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.success,
    gap: Spacing.md,
  },
  celebrationEmoji: {
    fontSize: 36,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: Spacing.sm,
  },
});
