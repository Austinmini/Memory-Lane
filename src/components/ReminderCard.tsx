import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radius, TouchTargets } from '../constants';
import { ReminderRecord } from '../db/types';
import { speakCalmly, stopSpeaking, isSpeaking } from '../services/speechService';

export interface ReminderCardProps {
  reminder: ReminderRecord;
  onToggleComplete?: (reminder: ReminderRecord) => void;
  onPressListen?: (reminder: ReminderRecord) => void;
  onPressEdit?: (reminder: ReminderRecord) => void;
  showEditButton?: boolean;
}

/**
 * Format '08:30' (24hr) into accessible '8:30 AM'.
 */
export function formatDisplayTime(timeOfDay24: string): string {
  const parts = timeOfDay24.split(':');
  if (parts.length !== 2) return timeOfDay24;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeOfDay24;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours12}:${minutesStr} ${ampm}`;
}

/**
 * Category display metadata.
 */
function getCategoryInfo(category: ReminderRecord['category']): { emoji: string; label: string } {
  switch (category) {
    case 'medication':
      return { emoji: '💊', label: 'Medication' };
    case 'meal':
      return { emoji: '🍲', label: 'Meal Time' };
    case 'hydration':
      return { emoji: '💧', label: 'Hydration' };
    case 'call':
      return { emoji: '📞', label: 'Family Call' };
    case 'rest':
      return { emoji: '🌙', label: 'Rest & Wind Down' };
    default:
      return { emoji: '⏰', label: 'Routine Reminder' };
  }
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onToggleComplete,
  onPressListen,
  onPressEdit,
  showEditButton = false,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const isCompleted = !!reminder.isCompletedToday;
  const displayTime = formatDisplayTime(reminder.timeOfDay);
  const { emoji, label } = getCategoryInfo(reminder.category);

  const handleToggleVoice = async () => {
    const speaking = await isSpeaking();
    if (speaking && isPlayingAudio) {
      await stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    onPressListen?.(reminder);
    setIsPlayingAudio(true);
    await speakCalmly(reminder.spokenMessage, {
      onStart: () => setIsPlayingAudio(true),
      onDone: () => setIsPlayingAudio(false),
      onStopped: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  return (
    <View
      style={[
        styles.card,
        isCompleted && styles.completedCard,
      ]}
    >
      {/* Top Meta Row: Time & Category Badge */}
      <View style={styles.topRow}>
        <View style={styles.timeBadge}>
          <Text style={[Typography.h3, { color: Colors.primary, fontWeight: '700' }]}>
            ⏰ {displayTime}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
          <View style={styles.categoryBadge}>
            <Text style={[Typography.badge, { color: Colors.textSecondary }]}>
              {emoji} {label}
            </Text>
          </View>

          {showEditButton && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onPressEdit?.(reminder)}
              activeOpacity={0.7}
              accessibilityLabel="Edit Reminder"
            >
              <Text style={[Typography.caption, { color: Colors.primary, fontWeight: '700' }]}>
                ✏️
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Reminder Title */}
      <Text
        style={[
          Typography.h2,
          {
            color: isCompleted ? Colors.textMuted : Colors.textPrimary,
            marginTop: Spacing.sm,
            textDecorationLine: isCompleted ? 'line-through' : 'none',
          },
        ]}
      >
        {reminder.title}
      </Text>

      {/* Spoken Instructions Quote */}
      <Text
        style={[
          Typography.body,
          {
            color: Colors.textSecondary,
            fontStyle: 'italic',
            marginVertical: Spacing.sm,
            lineHeight: 26,
          },
        ]}
      >
        "{reminder.spokenMessage}"
      </Text>

      {/* Dementia-Accessible Large Action Row (>= 56dp height) */}
      <View style={styles.actionRow}>
        {/* Listen Button */}
        <TouchableOpacity
          style={[
            styles.voiceButton,
            isPlayingAudio && { backgroundColor: Colors.accentWarm },
          ]}
          onPress={handleToggleVoice}
          activeOpacity={0.8}
          accessibilityLabel={isPlayingAudio ? 'Stop speaking reminder' : 'Listen to spoken instructions'}
          accessibilityRole="button"
        >
          <Text style={styles.actionIcon}>{isPlayingAudio ? '⏹' : '🔊'}</Text>
          <Text style={[Typography.button, { color: Colors.textInverse, marginLeft: Spacing.xs + 2 }]}>
            {isPlayingAudio ? 'Stop' : 'Listen'}
          </Text>
        </TouchableOpacity>

        {/* Done / Complete Toggle Button */}
        <TouchableOpacity
          style={[
            styles.doneButton,
            isCompleted ? styles.doneButtonCompleted : styles.doneButtonPending,
          ]}
          onPress={() => onToggleComplete?.(reminder)}
          activeOpacity={0.8}
          accessibilityLabel={isCompleted ? 'Mark reminder as not completed' : 'Mark reminder as completed'}
          accessibilityRole="button"
        >
          <Text style={[styles.actionIcon, { color: isCompleted ? Colors.textInverse : Colors.success }]}>
            {isCompleted ? '✓' : '○'}
          </Text>
          <Text
            style={[
              Typography.button,
              { color: isCompleted ? Colors.textInverse : Colors.success, marginLeft: Spacing.xs + 2 },
            ]}
          >
            {isCompleted ? 'Done' : 'Mark Done'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.md + 2,
    marginVertical: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  completedCard: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  voiceButton: {
    flex: 1,
    height: TouchTargets.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  doneButton: {
    flex: 1.1,
    height: TouchTargets.minHeight,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  doneButtonPending: {
    backgroundColor: Colors.surface,
    borderColor: Colors.success,
  },
  doneButtonCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  actionIcon: {
    fontSize: 22,
    color: Colors.textInverse,
  },
});
