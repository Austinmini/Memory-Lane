import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, TouchTargets } from '../constants';
import { MemoryRecord, ReminderRecord } from '../db/types';
import { formatDisplayTime } from '../components/ReminderCard';
import { speakCalmly, speakMemory, stopSpeaking } from '../services/speechService';
import { syncAllReminderNotifications } from '../services/notificationService';

export interface CaregiverDashboardScreenProps {
  memories: MemoryRecord[];
  reminders: ReminderRecord[];
  onReturnToPatientView: () => void;
  onAddMemory: () => void;
  onEditMemory: (memory: MemoryRecord) => void;
  onAddReminder: () => void;
  onEditReminder: (reminder: ReminderRecord) => void;
  onToggleReminder: (reminder: ReminderRecord) => Promise<void> | void;
  onRefreshData?: () => Promise<void> | void;
  statusLog?: string[];
  onTriggerTestAlarm?: () => Promise<void> | void;
  onTriggerTestModal?: () => void;
  onOpenPictureFrame?: () => void;
}

type DashboardTab = 'memories' | 'routines' | 'settings';

export const CaregiverDashboardScreen: React.FC<CaregiverDashboardScreenProps> = ({
  memories,
  reminders,
  onReturnToPatientView,
  onAddMemory,
  onEditMemory,
  onAddReminder,
  onEditReminder,
  onToggleReminder,
  onRefreshData,
  statusLog = [],
  onTriggerTestAlarm,
  onTriggerTestModal,
  onOpenPictureFrame,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('memories');
  const [syncingNotifications, setSyncingNotifications] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string>('');

  const handleSyncNotifications = async () => {
    setSyncingNotifications(true);
    setSyncSuccessMessage('');
    try {
      const count = await syncAllReminderNotifications();
      setSyncSuccessMessage(`Successfully re-synchronized ${count} scheduled notifications.`);
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      setSyncSuccessMessage(`Sync note: ${err?.message || 'Completed'}`);
    } finally {
      setSyncingNotifications(false);
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Navigation & Status Header */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onReturnToPatientView}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Return to Patient Home View"
          >
            <Text style={styles.backButtonText}>← Patient View</Text>
          </TouchableOpacity>

          <View style={styles.caregiverBadge}>
            <Text style={styles.caregiverBadgeText}>🔒 Caregiver Mode</Text>
          </View>
        </View>

        {/* Dashboard Title */}
        <View style={styles.titleSection}>
          <Text style={[Typography.h1, { color: Colors.primary }]}>
            Caregiver Dashboard
          </Text>
          <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.xs }]}>
            Manage family memories, daily routine reminders, and device settings.
          </Text>
        </View>

        {/* Segmented Tabs Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'memories' && styles.tabButtonActive]}
            onPress={() => setActiveTab('memories')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeTab === 'memories' && styles.tabButtonTextActive]}>
              📷 Memories ({memories.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'routines' && styles.tabButtonActive]}
            onPress={() => setActiveTab('routines')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeTab === 'routines' && styles.tabButtonTextActive]}>
              ⏰ Routines ({reminders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'settings' && styles.tabButtonActive]}
            onPress={() => setActiveTab('settings')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeTab === 'settings' && styles.tabButtonTextActive]}>
              ⚙️ Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================== */}
        {/* TAB 1: MEMORIES MANAGER                                    */}
        {/* ========================================================== */}
        {activeTab === 'memories' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[Typography.h2, { color: Colors.primary }]}>
                  Family & Story Cards
                </Text>
                <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
                  Pinned photos and stories shown in the Patient Carousel
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {onOpenPictureFrame && memories.length > 0 && (
                  <TouchableOpacity
                    style={[styles.outlineButton, { minHeight: 46, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderColor: Colors.primary }]}
                    onPress={onOpenPictureFrame}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Launch Digital Picture Frame Mode"
                  >
                    <Text style={styles.outlineButtonText}>🖼️ Frame Mode</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={onAddMemory}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Add New Memory"
                >
                  <Text style={styles.primaryActionButtonText}>+ Add Memory</Text>
                </TouchableOpacity>
              </View>
            </View>

            {memories.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📷</Text>
                <Text style={[Typography.h3, { color: Colors.primary }]}>No Memories Yet</Text>
                <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }]}>
                  Add photos of loved ones, pets, and happy moments so your loved one can view and listen to them.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryActionButton, { marginTop: Spacing.md }]}
                  onPress={onAddMemory}
                >
                  <Text style={styles.primaryActionButtonText}>+ Add First Memory</Text>
                </TouchableOpacity>
              </View>
            ) : (
              memories.map((m) => (
                <View key={m.id} style={styles.cardItem}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleWrap}>
                      {m.isFavorite === 1 && (
                        <Text style={styles.favoriteIcon}>⭐</Text>
                      )}
                      <Text style={[Typography.h3, { color: Colors.textPrimary }]}>
                        {m.title}
                      </Text>
                    </View>
                    <View style={styles.relationshipPill}>
                      <Text style={styles.relationshipPillText}>{m.relationship}</Text>
                    </View>
                  </View>

                  <Text
                    style={[Typography.body, { color: Colors.textSecondary, marginVertical: Spacing.sm }]}
                    numberOfLines={3}
                  >
                    {m.story}
                  </Text>

                  {/* Card Actions */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.outlineButton}
                      onPress={() => speakMemory(m.title, m.relationship, m.story)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.outlineButtonText}>🔊 Listen</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => onEditMemory(m)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editButtonText}>✏️ Edit Memory</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ========================================================== */}
        {/* TAB 2: ROUTINES MANAGER                                    */}
        {/* ========================================================== */}
        {activeTab === 'routines' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[Typography.h2, { color: Colors.primary }]}>
                  Daily Routines
                </Text>
                <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
                  Scheduled voice reminders announced throughout the day
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={onAddReminder}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Add New Daily Routine"
              >
                <Text style={styles.primaryActionButtonText}>+ Add Routine</Text>
              </TouchableOpacity>
            </View>

            {reminders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>⏰</Text>
                <Text style={[Typography.h3, { color: Colors.primary }]}>No Routines Set</Text>
                <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }]}>
                  Set up medication times, meal reminders, and hydration checks.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryActionButton, { marginTop: Spacing.md }]}
                  onPress={onAddReminder}
                >
                  <Text style={styles.primaryActionButtonText}>+ Add First Routine</Text>
                </TouchableOpacity>
              </View>
            ) : (
              reminders.map((r) => (
                <View key={r.id} style={styles.cardItem}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.routineTitleWrap}>
                      <Text style={styles.categoryEmoji}>{getCategoryEmoji(r.category)}</Text>
                      <View>
                        <Text style={[Typography.h3, { color: Colors.textPrimary }]}>
                          {r.title}
                        </Text>
                        <Text style={[Typography.caption, { color: Colors.primary, fontWeight: '700' }]}>
                          🕒 {formatDisplayTime(r.timeOfDay)} {r.repeatDaily ? '• Daily' : '• Once'}
                        </Text>
                      </View>
                    </View>

                    {/* Completion status pill */}
                    <View
                      style={[
                        styles.statusPill,
                        r.isCompletedToday ? styles.statusPillDone : styles.statusPillPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          r.isCompletedToday ? styles.statusPillTextDone : styles.statusPillTextPending,
                        ]}
                      >
                        {r.isCompletedToday ? '✓ Done' : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  {/* Spoken voice message */}
                  <View style={styles.speechQuoteBox}>
                    <Text style={styles.speechQuoteText}>
                      💬 "{r.spokenMessage}"
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.outlineButton}
                      onPress={() => speakCalmly(r.spokenMessage)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.outlineButtonText}>🔊 Hear Voice</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.outlineButton}
                      onPress={() => onToggleReminder(r)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.outlineButtonText}>
                        {r.isCompletedToday ? '↩ Mark Pending' : '✓ Mark Done'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => onEditReminder(r)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ========================================================== */}
        {/* TAB 3: SETTINGS & DIAGNOSTICS                              */}
        {/* ========================================================== */}
        {activeTab === 'settings' && (
          <View>
            {/* Audio & Voice Controls */}
            <View style={styles.settingsSectionCard}>
              <Text style={[Typography.h3, { color: Colors.primary, marginBottom: Spacing.xs }]}>
                🔊 Soothing Voice Narration
              </Text>
              <Text style={[Typography.caption, { color: Colors.textSecondary, marginBottom: Spacing.md }]}>
                Calm English Text-to-Speech tuned for cognitive ease (Rate: 0.85, pitch: 1.0).
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
                <TouchableOpacity
                  style={[styles.primaryActionButton, { backgroundColor: Colors.primary }]}
                  onPress={() => speakCalmly('Hello. This is the soothing English voice narration used for Memory Lane.')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryActionButtonText}>🔊 Test Voice Narration</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.outlineButton, { borderColor: Colors.textMuted }]}
                  onPress={() => stopSpeaking()}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.outlineButtonText, { color: Colors.textMuted }]}>⏹ Stop Voice</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notification & Alarm Tools */}
            <View style={styles.settingsSectionCard}>
              <Text style={[Typography.h3, { color: Colors.primary, marginBottom: Spacing.xs }]}>
                🔔 Routine Alarms & Notifications
              </Text>
              <Text style={[Typography.caption, { color: Colors.textSecondary, marginBottom: Spacing.md }]}>
                Uses permissible non-dangerous local notifications adhering strictly to Google Play policy.
              </Text>

              <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
                {onTriggerTestAlarm && (
                  <TouchableOpacity
                    style={[styles.primaryActionButton, { backgroundColor: Colors.accentWarm }]}
                    onPress={onTriggerTestAlarm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryActionButtonText}>🔔 Test 5-Second Alarm</Text>
                  </TouchableOpacity>
                )}

                {onTriggerTestModal && (
                  <TouchableOpacity
                    style={[styles.primaryActionButton, { backgroundColor: Colors.primaryMuted }]}
                    onPress={onTriggerTestModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryActionButtonText}>📢 Test Alert Modal</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={handleSyncNotifications}
                  disabled={syncingNotifications}
                  activeOpacity={0.8}
                >
                  <Text style={styles.outlineButtonText}>
                    {syncingNotifications ? '⏳ Syncing...' : '🔄 Re-sync Alarms'}
                  </Text>
                </TouchableOpacity>
              </View>

              {syncSuccessMessage ? (
                <Text style={[Typography.caption, { color: Colors.success, marginTop: Spacing.sm, fontWeight: '700' }]}>
                  ✓ {syncSuccessMessage}
                </Text>
              ) : null}
            </View>

            {/* Privacy & Safety Information */}
            <View style={styles.settingsSectionCard}>
              <Text style={[Typography.h3, { color: Colors.primary, marginBottom: Spacing.xs }]}>
                🛡️ Offline Privacy & Data Safety
              </Text>
              <Text style={[Typography.caption, { color: Colors.textSecondary, marginBottom: Spacing.sm }]}>
                Memory Lane operates 100% locally on your device.
              </Text>
              <View style={styles.privacyBulletRow}>
                <Text style={styles.privacyCheck}>✓</Text>
                <Text style={[Typography.caption, { color: Colors.textPrimary, flex: 1 }]}>
                  Zero personal data transmitted to any external server or cloud.
                </Text>
              </View>
              <View style={styles.privacyBulletRow}>
                <Text style={styles.privacyCheck}>✓</Text>
                <Text style={[Typography.caption, { color: Colors.textPrimary, flex: 1 }]}>
                  Zero third-party trackers, analytics, or advertisements.
                </Text>
              </View>
              <View style={styles.privacyBulletRow}>
                <Text style={styles.privacyCheck}>✓</Text>
                <Text style={[Typography.caption, { color: Colors.textPrimary, flex: 1 }]}>
                  All photos and memory notes remain sandboxed securely on this device.
                </Text>
              </View>

              <View style={styles.disclaimerBox}>
                <Text style={[Typography.caption, { color: Colors.textMuted, fontStyle: 'italic' }]}>
                  Medical Disclaimer: Memory Lane is an assistive lifestyle and memory companion designed to help caregivers organize daily schedules and share comforting family memories. It is not intended for medical diagnosis, clinical treatment, or critical emergency dispatch.
                </Text>
              </View>
            </View>

            {/* System Diagnostics Log */}
            {statusLog.length > 0 && (
              <View style={styles.settingsSectionCard}>
                <Text style={[Typography.h3, { color: Colors.primary, marginBottom: Spacing.xs }]}>
                  📋 System Diagnostics Log
                </Text>
                <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: Spacing.sm }]}>
                  Internal SQLite migration & service health status:
                </Text>
                {statusLog.map((log, i) => (
                  <Text key={i} style={[Typography.caption, { color: Colors.textSecondary, marginVertical: 2 }]}>
                    {log}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
  backButton: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    minHeight: TouchTargets.minHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    ...Typography.button,
    color: Colors.primary,
    fontSize: 16,
  },
  caregiverBadge: {
    backgroundColor: Colors.accentWarmLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accentWarm,
  },
  caregiverBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.accentWarm,
  },
  titleSection: {
    marginBottom: Spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabButtonTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryActionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
    fontSize: 15,
  },
  cardItem: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.xs,
  },
  favoriteIcon: {
    fontSize: 18,
  },
  relationshipPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  relationshipPillText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  routineTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 26,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusPillDone: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  statusPillPending: {
    backgroundColor: Colors.accentWarmLight,
    borderColor: Colors.accentWarm,
  },
  statusPillText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 13,
  },
  statusPillTextDone: {
    color: Colors.success,
  },
  statusPillTextPending: {
    color: Colors.accentWarm,
  },
  speechQuoteBox: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginVertical: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  speechQuoteText: {
    ...Typography.body,
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
  },
  outlineButton: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  editButton: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  settingsSectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  privacyBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginVertical: 3,
  },
  privacyCheck: {
    color: Colors.success,
    fontWeight: '700',
    fontSize: 16,
  },
  disclaimerBox: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: Spacing.sm,
  },
});
