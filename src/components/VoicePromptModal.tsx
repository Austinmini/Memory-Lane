import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, TouchTargets } from '../constants';
import { ReminderRecord } from '../db/types';
import { speakCalmly, stopSpeaking, isSpeaking } from '../services/speechService';
import { formatDisplayTime } from './ReminderCard';

export interface VoicePromptModalProps {
  visible: boolean;
  reminder: ReminderRecord | null;
  /**
   * Callback when patient or caregiver acknowledges the reminder.
   */
  onAcknowledge: (reminder: ReminderRecord | null) => void;
  /**
   * Optional callback when modal is dismissed without marking done.
   */
  onDismiss?: () => void;
}

function getCategoryIcon(category?: ReminderRecord['category']): { icon: string; label: string } {
  switch (category) {
    case 'medication':
      return { icon: '💊', label: 'Medication Time' };
    case 'meal':
      return { icon: '🍲', label: 'Meal Time' };
    case 'hydration':
      return { icon: '💧', label: 'Hydration Check' };
    case 'call':
      return { icon: '📞', label: 'Family Call' };
    case 'rest':
      return { icon: '🌙', label: 'Rest Time' };
    default:
      return { icon: '⏰', label: 'Daily Reminder' };
  }
}

export const VoicePromptModal: React.FC<VoicePromptModalProps> = ({
  visible,
  reminder,
  onAcknowledge,
  onDismiss,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Automatically speak the reminder when the modal opens
  useEffect(() => {
    let isCancelled = false;

    if (visible && reminder) {
      const messageToSpeak = `${reminder.title}. ${reminder.spokenMessage}`;
      setIsPlaying(true);

      speakCalmly(messageToSpeak, {
        onStart: () => {
          if (!isCancelled) setIsPlaying(true);
        },
        onDone: () => {
          if (!isCancelled) setIsPlaying(false);
        },
        onStopped: () => {
          if (!isCancelled) setIsPlaying(false);
        },
        onError: () => {
          if (!isCancelled) setIsPlaying(false);
        },
      });
    }

    return () => {
      isCancelled = true;
      stopSpeaking();
      setIsPlaying(false);
    };
  }, [visible, reminder]);

  const handleReplayVoice = async () => {
    if (!reminder) return;
    const speaking = await isSpeaking();
    if (speaking && isPlaying) {
      await stopSpeaking();
      setIsPlaying(false);
      return;
    }

    const messageToSpeak = `${reminder.title}. ${reminder.spokenMessage}`;
    setIsPlaying(true);
    await speakCalmly(messageToSpeak, {
      onStart: () => setIsPlaying(true),
      onDone: () => setIsPlaying(false),
      onStopped: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const handleAcknowledgePress = async () => {
    await stopSpeaking();
    setIsPlaying(false);
    onAcknowledge(reminder);
  };

  const handleDismissPress = async () => {
    await stopSpeaking();
    setIsPlaying(false);
    if (onDismiss) {
      onDismiss();
    } else {
      onAcknowledge(reminder);
    }
  };

  if (!reminder && !visible) {
    return null;
  }

  const { icon, label } = getCategoryIcon(reminder?.category);
  const formattedTime = reminder?.timeOfDay ? formatDisplayTime(reminder.timeOfDay) : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismissPress}
    >
      <SafeAreaView style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Gentle Header Tag */}
          <View style={styles.headerTagRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.pillEmoji}>{icon}</Text>
              <Text style={[Typography.caption, { color: Colors.primary, fontWeight: '700' }]}>
                {label}
              </Text>
            </View>

            {formattedTime ? (
              <Text style={[Typography.caption, { color: Colors.textMuted, fontWeight: '600' }]}>
                ⏰ {formattedTime}
              </Text>
            ) : null}
          </View>

          {/* Large Calming Center Icon */}
          <View style={styles.centerIconContainer}>
            <Text style={styles.centerIconEmoji}>{icon}</Text>
          </View>

          {/* Primary Reminder Title */}
          <Text style={[Typography.h1, { color: Colors.textPrimary, textAlign: 'center' }]}>
            {reminder?.title || 'Daily Routine Reminder'}
          </Text>

          {/* Spoken Instruction Body (Large font for easy readability) */}
          <View style={styles.spokenMessageBox}>
            <Text style={[Typography.bodyLarge, { color: Colors.textSecondary, textAlign: 'center', lineHeight: 32 }]}>
              "{reminder?.spokenMessage || 'Time for your daily routine.'}"
            </Text>
          </View>

          {/* Voice Speaking Status Indicator */}
          <View style={styles.speechStatusRow}>
            <Text style={[Typography.caption, { color: isPlaying ? Colors.accentWarm : Colors.textMuted }]}>
              {isPlaying ? '🔊 Speaking instruction...' : 'Tap below to listen again or confirm'}
            </Text>
          </View>

          {/* Action Buttons: Acknowledge & Hear Again */}
          <View style={styles.actionColumn}>
            {/* Primary Acknowledge Button (Large Target >= 68dp) */}
            <TouchableOpacity
              style={styles.acknowledgeButton}
              onPress={handleAcknowledgePress}
              activeOpacity={0.8}
              accessibilityLabel="Confirm task is completed"
              accessibilityRole="button"
            >
              <Text style={styles.acknowledgeIcon}>✓</Text>
              <Text style={[Typography.buttonLarge, { color: Colors.textInverse, marginLeft: Spacing.sm }]}>
                I Have Done This
              </Text>
            </TouchableOpacity>

            {/* Replay Voice Readout Button */}
            <TouchableOpacity
              style={[
                styles.replayButton,
                isPlaying && { borderColor: Colors.accentWarm },
              ]}
              onPress={handleReplayVoice}
              activeOpacity={0.7}
              accessibilityLabel="Hear spoken reminder again"
              accessibilityRole="button"
            >
              <Text style={styles.replayIcon}>{isPlaying ? '⏹' : '🔊'}</Text>
              <Text style={[Typography.button, { color: Colors.primary, marginLeft: Spacing.xs + 2 }]}>
                {isPlaying ? 'Stop Audio' : 'Hear Instruction Again'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 24, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.borderStrong,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTagRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  pillEmoji: {
    fontSize: 18,
    marginRight: Spacing.xs,
  },
  centerIconContainer: {
    width: 100,
    height: 100,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  centerIconEmoji: {
    fontSize: 52,
  },
  spokenMessageBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    width: '100%',
  },
  speechStatusRow: {
    marginVertical: Spacing.xs,
  },
  actionColumn: {
    width: '100%',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  acknowledgeButton: {
    width: '100%',
    height: TouchTargets.largeButton,
    backgroundColor: Colors.success,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  acknowledgeIcon: {
    fontSize: 28,
    color: Colors.textInverse,
    fontWeight: '700',
  },
  replayButton: {
    width: '100%',
    height: TouchTargets.minHeight,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayIcon: {
    fontSize: 22,
    color: Colors.primary,
  },
});
