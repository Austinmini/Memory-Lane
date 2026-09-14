import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, TouchTargets } from '../constants';
import { ReminderCategory, ReminderRecord } from '../db/types';
import { ReminderRepository } from '../db/reminderRepository';
import {
  scheduleReminderNotification,
  cancelReminderNotification,
  parseTimeString,
} from '../services/notificationService';
import { speakCalmly, stopSpeaking, isSpeaking } from '../services/speechService';
import { formatDisplayTime } from '../components/ReminderCard';

export interface RoutineTemplate {
  title: string;
  category: ReminderCategory;
  timeOfDay: string;
  spokenMessage: string;
  emoji: string;
}

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    title: 'Morning Medication',
    category: 'medication',
    timeOfDay: '08:30',
    spokenMessage: 'Good morning! It is time to take your morning medication with a fresh glass of water.',
    emoji: '💊',
  },
  {
    title: 'Warm Lunch',
    category: 'meal',
    timeOfDay: '12:30',
    spokenMessage: 'It is twelve thirty in the afternoon. Time to enjoy a delicious, warm lunch.',
    emoji: '🍲',
  },
  {
    title: 'Afternoon Hydration',
    category: 'hydration',
    timeOfDay: '15:00',
    spokenMessage: 'Time for a nice glass of cool water or warm herbal tea to keep you feeling refreshed.',
    emoji: '💧',
  },
  {
    title: 'Call Family',
    category: 'call',
    timeOfDay: '17:00',
    spokenMessage: "It is five o'clock. Let us give Sarah a call or say hello to family.",
    emoji: '📞',
  },
  {
    title: 'Gentle Evening Rest',
    category: 'rest',
    timeOfDay: '20:30',
    spokenMessage: 'The day is winding down. Time to relax, dim the lights, and get ready for a restful night.',
    emoji: '🌙',
  },
  {
    title: 'Evening Medication',
    category: 'medication',
    timeOfDay: '21:00',
    spokenMessage: 'Time to take your evening medication with water before bed.',
    emoji: '💊',
  },
];

const CATEGORIES: { category: ReminderCategory; label: string; emoji: string }[] = [
  { category: 'medication', label: 'Meds', emoji: '💊' },
  { category: 'meal', label: 'Meals', emoji: '🍲' },
  { category: 'hydration', label: 'Water', emoji: '💧' },
  { category: 'call', label: 'Call', emoji: '📞' },
  { category: 'rest', label: 'Rest', emoji: '🌙' },
  { category: 'custom', label: 'Other', emoji: '⏰' },
];

export interface EditReminderScreenProps {
  /**
   * Optional reminder to edit. If null or undefined, operates in "Add Reminder" mode.
   */
  reminder?: ReminderRecord | null;
  onSave?: (savedReminder: ReminderRecord) => void;
  onCancel?: () => void;
  onDelete?: (deletedId: string) => void;
}

export const EditReminderScreen: React.FC<EditReminderScreenProps> = ({
  reminder,
  onSave,
  onCancel,
  onDelete,
}) => {
  const isEditing = !!reminder;

  const [title, setTitle] = useState(reminder?.title || '');
  const [category, setCategory] = useState<ReminderCategory>(reminder?.category || 'medication');
  const [timeOfDay, setTimeOfDay] = useState(reminder?.timeOfDay || '08:30');
  const [spokenMessage, setSpokenMessage] = useState(
    reminder?.spokenMessage || 'Good morning! It is time to take your morning medication with a glass of water.'
  );
  const [repeatDaily, setRepeatDaily] = useState(reminder ? reminder.repeatDaily === 1 : true);
  const [isEnabled, setIsEnabled] = useState(reminder ? reminder.isEnabled === 1 : true);

  // Accessible time editor states
  const initialTime = parseTimeString(reminder?.timeOfDay || '08:30');
  const [selectedHour12, setSelectedHour12] = useState<number>(
    initialTime.hour % 12 === 0 ? 12 : initialTime.hour % 12
  );
  const [selectedMinute, setSelectedMinute] = useState<string>(
    initialTime.minute < 10 ? `0${initialTime.minute}` : `${initialTime.minute}`
  );
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>(
    initialTime.hour >= 12 ? 'PM' : 'AM'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Sync 12-hour picker to 'HH:mm' string
  const updateFormattedTimeOfDay = (hour12: number, minuteStr: string, ampm: 'AM' | 'PM') => {
    let hour24 = hour12 % 12;
    if (ampm === 'PM') hour24 += 12;
    const hourFormatted = hour24 < 10 ? `0${hour24}` : `${hour24}`;
    setTimeOfDay(`${hourFormatted}:${minuteStr}`);
  };

  const handleHourSelect = (h: number) => {
    setSelectedHour12(h);
    updateFormattedTimeOfDay(h, selectedMinute, selectedAmPm);
  };

  const handleMinuteSelect = (m: string) => {
    setSelectedMinute(m);
    updateFormattedTimeOfDay(selectedHour12, m, selectedAmPm);
  };

  const handleAmPmSelect = (ampm: 'AM' | 'PM') => {
    setSelectedAmPm(ampm);
    updateFormattedTimeOfDay(selectedHour12, selectedMinute, ampm);
  };

  // Stop TTS speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  /**
   * Apply a quick routine template preset.
   */
  const handleApplyTemplate = (template: RoutineTemplate) => {
    setTitle(template.title);
    setCategory(template.category);
    setTimeOfDay(template.timeOfDay);
    setSpokenMessage(template.spokenMessage);

    const parsed = parseTimeString(template.timeOfDay);
    const h12 = parsed.hour % 12 === 0 ? 12 : parsed.hour % 12;
    const minStr = parsed.minute < 10 ? `0${parsed.minute}` : `${parsed.minute}`;
    const ampm = parsed.hour >= 12 ? 'PM' : 'AM';
    setSelectedHour12(h12);
    setSelectedMinute(minStr);
    setSelectedAmPm(ampm);
  };

  /**
   * Test the calming voice instruction out loud.
   */
  const handleToggleVoicePreview = async () => {
    const speaking = await isSpeaking();
    if (speaking && isPlayingPreview) {
      await stopSpeaking();
      setIsPlayingPreview(false);
      return;
    }

    const testMessage = spokenMessage.trim() || 'It is time for your scheduled routine.';
    setIsPlayingPreview(true);
    await speakCalmly(testMessage, {
      onStart: () => setIsPlayingPreview(true),
      onDone: () => setIsPlayingPreview(false),
      onStopped: () => setIsPlayingPreview(false),
      onError: () => setIsPlayingPreview(false),
    });
  };

  /**
   * Save reminder to SQLite and configure local notification scheduling.
   */
  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Title Required', 'Please enter a name for this reminder (e.g. "Morning Medication").');
      return;
    }

    const trimmedSpoken = spokenMessage.trim();
    if (!trimmedSpoken) {
      Alert.alert('Voice Message Required', 'Please write the spoken instruction to be read aloud.');
      return;
    }

    setIsSaving(true);
    try {
      const reminderId = reminder?.id || `rem_${Date.now()}`;
      let savedRecord: ReminderRecord;

      if (isEditing && reminder) {
        await ReminderRepository.update(reminder.id, {
          title: trimmedTitle,
          category,
          timeOfDay,
          spokenMessage: trimmedSpoken,
          repeatDaily: repeatDaily ? 1 : 0,
          isEnabled: isEnabled ? 1 : 0,
        });

        savedRecord = {
          ...reminder,
          title: trimmedTitle,
          category,
          timeOfDay,
          spokenMessage: trimmedSpoken,
          repeatDaily: repeatDaily ? 1 : 0,
          isEnabled: isEnabled ? 1 : 0,
          updatedAt: Date.now(),
        };
      } else {
        savedRecord = await ReminderRepository.create({
          id: reminderId,
          title: trimmedTitle,
          category,
          timeOfDay,
          spokenMessage: trimmedSpoken,
          repeatDaily: repeatDaily ? 1 : 0,
          isEnabled: isEnabled ? 1 : 0,
          isCompletedToday: 0,
          lastCompletedDate: null,
          notificationId: null,
        });
      }

      // Schedule or update local notification alarm
      if (savedRecord.isEnabled) {
        const notifId = await scheduleReminderNotification(savedRecord);
        if (notifId) {
          savedRecord.notificationId = notifId;
        }
      } else if (savedRecord.notificationId) {
        await cancelReminderNotification(savedRecord.notificationId);
      }

      onSave?.(savedRecord);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save reminder. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Delete reminder and cancel scheduled notification.
   */
  const handleDelete = () => {
    if (!reminder) return;

    Alert.alert(
      'Delete Reminder?',
      `Are you sure you want to delete "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              if (reminder.notificationId) {
                await cancelReminderNotification(reminder.notificationId);
              }
              await ReminderRepository.delete(reminder.id);
              onDelete?.(reminder.id);
            } catch (err: any) {
              Alert.alert('Delete Error', err?.message || 'Failed to delete reminder.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const displayFormattedTime = formatDisplayTime(timeOfDay);

  return (
    <KeyboardAvoidingView
      style={styles.screenWrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Navigation Bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            <Text style={[Typography.bodyMediumBold, { color: Colors.textSecondary }]}>
              ✕ Cancel
            </Text>
          </TouchableOpacity>

          <Text style={[Typography.h2, { color: Colors.primary }]}>
            {isEditing ? 'Edit Reminder' : 'Add Routine'}
          </Text>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.textInverse} />
            ) : (
              <Text style={[Typography.button, { color: Colors.textInverse }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Routine Preset Templates */}
        {!isEditing && (
          <View style={styles.card}>
            <Text style={[Typography.h3, { color: Colors.textPrimary, marginBottom: Spacing.xs }]}>
              💡 Quick Routine Templates
            </Text>
            <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: Spacing.sm }]}>
              Tap any template to auto-fill proven dementia care routines:
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templatesScroll}>
              {ROUTINE_TEMPLATES.map((tpl) => (
                <TouchableOpacity
                  key={tpl.title}
                  style={styles.templateCard}
                  onPress={() => handleApplyTemplate(tpl)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.templateEmoji}>{tpl.emoji}</Text>
                  <Text style={[Typography.badge, { color: Colors.textPrimary, marginTop: 4 }]}>
                    {tpl.title}
                  </Text>
                  <Text style={[Typography.caption, { color: Colors.primary, fontWeight: '700', marginTop: 2 }]}>
                    {formatDisplayTime(tpl.timeOfDay)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Title Input */}
        <View style={styles.card}>
          <Text style={[Typography.h3, { color: Colors.textPrimary, marginBottom: Spacing.xs }]}>
            Reminder Title *
          </Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Morning Medication, Lunch, Glass of Water"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="next"
            maxLength={50}
          />
        </View>

        {/* Category Selector */}
        <View style={styles.card}>
          <Text style={[Typography.h3, { color: Colors.textPrimary, marginBottom: Spacing.xs }]}>
            Category
          </Text>
          <View style={styles.chipsWrap}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.category;
              return (
                <TouchableOpacity
                  key={cat.category}
                  style={[
                    styles.categoryChip,
                    isSelected && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                  ]}
                  onPress={() => setCategory(cat.category)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                  <Text
                    style={[
                      Typography.caption,
                      {
                        color: isSelected ? Colors.textInverse : Colors.textPrimary,
                        fontWeight: '600',
                        marginLeft: 4,
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Accessible Time Selector */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={[Typography.h3, { color: Colors.textPrimary }]}>
              Scheduled Time
            </Text>
            <View style={styles.selectedTimeBadge}>
              <Text style={[Typography.h3, { color: Colors.primary, fontWeight: '700' }]}>
                ⏰ {displayFormattedTime}
              </Text>
            </View>
          </View>

          {/* Hour Selector (1-12) */}
          <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.xs, fontWeight: '600' }]}>
            Hour:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroll}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => {
              const isSelected = selectedHour12 === h;
              return (
                <TouchableOpacity
                  key={h}
                  style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                  onPress={() => handleHourSelect(h)}
                  activeOpacity={0.7}
                >
                  <Text style={[Typography.badge, { color: isSelected ? Colors.textInverse : Colors.textPrimary }]}>
                    {h}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Minute Selector */}
          <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.xs, fontWeight: '600' }]}>
            Minute:
          </Text>
          <View style={styles.chipsWrap}>
            {['00', '15', '30', '45'].map((m) => {
              const isSelected = selectedMinute === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                  onPress={() => handleMinuteSelect(m)}
                  activeOpacity={0.7}
                >
                  <Text style={[Typography.badge, { color: isSelected ? Colors.textInverse : Colors.textPrimary }]}>
                    :{m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* AM / PM Selector */}
          <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.xs, fontWeight: '600' }]}>
            Period:
          </Text>
          <View style={styles.ampmRow}>
            {(['AM', 'PM'] as const).map((period) => {
              const isSelected = selectedAmPm === period;
              return (
                <TouchableOpacity
                  key={period}
                  style={[styles.ampmButton, isSelected && styles.ampmButtonSelected]}
                  onPress={() => handleAmPmSelect(period)}
                  activeOpacity={0.7}
                >
                  <Text style={[Typography.button, { color: isSelected ? Colors.textInverse : Colors.textPrimary }]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Spoken Instruction Input & Audio Test */}
        <View style={styles.card}>
          <Text style={[Typography.h3, { color: Colors.textPrimary, marginBottom: Spacing.xs }]}>
            Spoken Voice Message *
          </Text>
          <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: Spacing.sm }]}>
            Spoken aloud by the soothing voice engine when the reminder triggers.
          </Text>

          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={spokenMessage}
            onChangeText={setSpokenMessage}
            placeholder="e.g. Good morning! It is time to take your morning medication with a fresh glass of water."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Voice Preview Button */}
          <TouchableOpacity
            style={[
              styles.voicePreviewButton,
              isPlayingPreview && { backgroundColor: Colors.accentWarm },
            ]}
            onPress={handleToggleVoicePreview}
            activeOpacity={0.8}
          >
            <Text style={styles.voiceIcon}>{isPlayingPreview ? '⏹' : '🔊'}</Text>
            <Text style={[Typography.bodyMediumBold, { color: Colors.textInverse, marginLeft: Spacing.sm }]}>
              {isPlayingPreview ? 'Stop Voice Preview' : 'Test Calming Voice Narration'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Repeat Daily & Enabled Toggles */}
        <View style={[styles.card, styles.switchRow]}>
          <View style={{ flex: 1, paddingRight: Spacing.md }}>
            <Text style={[Typography.h3, { color: Colors.textPrimary }]}>
              🔄 Repeat Daily
            </Text>
            <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 2 }]}>
              Repeats automatically every day at the scheduled time.
            </Text>
          </View>
          <Switch
            value={repeatDaily}
            onValueChange={setRepeatDaily}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Platform.OS === 'android' ? Colors.surface : undefined}
          />
        </View>

        <View style={[styles.card, styles.switchRow]}>
          <View style={{ flex: 1, paddingRight: Spacing.md }}>
            <Text style={[Typography.h3, { color: Colors.textPrimary }]}>
              🔔 Reminder Active
            </Text>
            <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 2 }]}>
              Enable or temporarily pause this reminder without deleting it.
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={setIsEnabled}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Platform.OS === 'android' ? Colors.surface : undefined}
          />
        </View>

        {/* Delete Button (Edit Mode Only) */}
        {isEditing && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            <Text style={[Typography.button, { color: Colors.danger }]}>
              🗑 Delete This Routine
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cancelButton: {
    minHeight: TouchTargets.minHeight,
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  templatesScroll: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  templateCard: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    width: 140,
    alignItems: 'center',
  },
  templateEmoji: {
    fontSize: 28,
  },
  textInput: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  multilineInput: {
    minHeight: 110,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedTimeBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  timeScroll: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
    paddingVertical: Spacing.xs,
  },
  timeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    minWidth: 46,
    alignItems: 'center',
  },
  timeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ampmRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  ampmButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  voicePreviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    minHeight: 52,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  voiceIcon: {
    fontSize: 22,
    color: Colors.textInverse,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteButton: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.lg,
    minHeight: TouchTargets.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
});
