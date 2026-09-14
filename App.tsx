import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from './src/constants';
import { MemoryRepository, ReminderRepository, MemoryRecord, ReminderRecord } from './src/db';
import {
  ensureMemoriesDirectoryExists,
  speakCalmly,
  speakMemory,
  stopSpeaking,
  setupNotificationHandler,
  setupNotificationChannel,
  requestNotificationPermissions,
  syncAllReminderNotifications,
  scheduleTestNotification,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from './src/services';
import { MemoryCarousel, HeaderTimeWidget, ReminderCard, VoicePromptModal } from './src/components';
import { EditMemoryScreen, EditReminderScreen, PatientHomeScreen } from './src/screens';

// Configure notification presentation handler
setupNotificationHandler();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [appMode, setAppMode] = useState<'patient' | 'caregiver'>('patient');
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [sandboxDir, setSandboxDir] = useState<string>('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedMemoryForEdit, setSelectedMemoryForEdit] = useState<MemoryRecord | null>(null);
  const [activePromptReminder, setActivePromptReminder] = useState<ReminderRecord | null>(null);
  const [isPromptModalVisible, setIsPromptModalVisible] = useState(false);
  const [isReminderEditorOpen, setIsReminderEditorOpen] = useState(false);
  const [selectedReminderForEdit, setSelectedReminderForEdit] = useState<ReminderRecord | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    const logs: string[] = [];

    try {
      logs.push('⏳ Initializing SQLite & Running Migrations...');
      await MemoryRepository.seedIfEmpty();
      await ReminderRepository.seedIfEmpty();
      logs.push('✅ SQLite tables & indexes verified.');

      logs.push('⏳ Checking Sandbox File System...');
      try {
        const dir = await ensureMemoriesDirectoryExists();
        setSandboxDir(dir);
        logs.push(`✅ Sandbox Directory: ${dir}`);
      } catch (err: any) {
        logs.push(`⚠️ Storage note: ${err?.message || 'File system active'}`);
      }

      logs.push('⏳ Fetching memories from SQLite...');
      const loadedMemories = await MemoryRepository.getAll();
      setMemories(loadedMemories);
      logs.push(`✅ Loaded ${loadedMemories.length} memories from DB.`);

      logs.push('⏳ Fetching reminders from SQLite...');
      const loadedReminders = await ReminderRepository.getAll();
      setReminders(loadedReminders);
      logs.push(`✅ Loaded ${loadedReminders.length} routine reminders.`);

      logs.push('⏳ Configuring Safe Local Notifications...');
      try {
        await setupNotificationChannel();
        const granted = await requestNotificationPermissions();
        logs.push(granted ? '✅ Notification Permissions: Granted (POST_NOTIFICATIONS)' : 'ℹ️ Notification Permissions: Pending / Web');
        const count = await syncAllReminderNotifications();
        logs.push(`✅ Scheduled ${count} daily routine alarms safely (0 dangerous exact alarms).`);
      } catch (notifErr: any) {
        logs.push(`⚠️ Notification note: ${notifErr?.message || String(notifErr)}`);
      }

      logs.push('🎉 Phase 4A Safe Local Notification Service Ready!');
    } catch (err: any) {
      logs.push(`❌ Error: ${err?.message || String(err)}`);
    } finally {
      setStatusLog(logs);
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();

    // Auto-display Voice Prompt Alert Modal when notification triggers or is tapped
    const showVoiceModalFromNotification = (data: any, fallbackBody?: string, fallbackTitle?: string) => {
      const reminderId = data?.reminderId;
      const title = data?.title || fallbackTitle || 'Routine Reminder';
      const spokenMessage = (data?.spokenMessage as string) || fallbackBody || 'Time for your daily routine.';
      const category = data?.category || 'hydration';
      const timeOfDay = data?.timeOfDay || '12:00';

      const record: ReminderRecord = {
        id: reminderId || `rem_temp_${Date.now()}`,
        title,
        category,
        timeOfDay,
        spokenMessage,
        repeatDaily: 1,
        isEnabled: 1,
        isCompletedToday: 0,
        lastCompletedDate: null,
        notificationId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setActivePromptReminder(record);
      setIsPromptModalVisible(true);
    };

    const subReceived = addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      showVoiceModalFromNotification(
        data,
        notification.request.content.body || '',
        notification.request.content.title || ''
      );
    });

    const subResponse = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      showVoiceModalFromNotification(
        data,
        response.notification.request.content.body || '',
        response.notification.request.content.title || ''
      );
    });

    return () => {
      subReceived.remove();
      subResponse.remove();
    };
  }, []);

  const handleToggleReminder = async (item: ReminderRecord) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (item.isCompletedToday) {
      await ReminderRepository.update(item.id, { isCompletedToday: 0 });
    } else {
      await ReminderRepository.markCompleted(item.id, todayStr);
    }
    const updated = await ReminderRepository.getAll();
    setReminders(updated);
  };

  const handleOpenAddMemory = () => {
    setSelectedMemoryForEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditMemory = (mem: MemoryRecord) => {
    setSelectedMemoryForEdit(mem);
    setIsEditorOpen(true);
  };

  const handleSaveOrDeleteMemory = async () => {
    setIsEditorOpen(false);
    setSelectedMemoryForEdit(null);
    const updated = await MemoryRepository.getAll();
    setMemories(updated);
  };

  const handleAcknowledgeVoiceModal = async (reminder: ReminderRecord | null) => {
    if (reminder && reminder.id) {
      const todayStr = new Date().toISOString().split('T')[0];
      await ReminderRepository.markCompleted(reminder.id, todayStr);
      const updated = await ReminderRepository.getAll();
      setReminders(updated);
    }
    setIsPromptModalVisible(false);
    setActivePromptReminder(null);
  };

  const handleTriggerTestNotification = async () => {
    await scheduleTestNotification(
      5,
      '💊 Reminder: Afternoon Hydration',
      'Time for a nice glass of cool water or warm herbal tea to keep you feeling refreshed.'
    );
  };

  const handleOpenTestVoiceModal = () => {
    setActivePromptReminder({
      id: 'rem_modal_test',
      title: 'Morning Medication',
      category: 'medication',
      timeOfDay: '08:30',
      spokenMessage: 'Good morning! It is time to take your morning medication with a fresh glass of water.',
      repeatDaily: 1,
      isEnabled: 1,
      isCompletedToday: 0,
      lastCompletedDate: null,
      notificationId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setIsPromptModalVisible(true);
  };

  const handleOpenAddReminder = () => {
    setSelectedReminderForEdit(null);
    setIsReminderEditorOpen(true);
  };

  const handleOpenEditReminder = (item: ReminderRecord) => {
    setSelectedReminderForEdit(item);
    setIsReminderEditorOpen(true);
  };

  const handleSaveOrDeleteReminder = async () => {
    setIsReminderEditorOpen(false);
    setSelectedReminderForEdit(null);
    const updated = await ReminderRepository.getAll();
    setReminders(updated);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: Spacing.md }]}>
            Loading Memory Lane...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {appMode === 'patient' ? (
        <PatientHomeScreen
          memories={memories}
          reminders={reminders}
          onToggleReminder={handleToggleReminder}
          onOpenCaregiverMode={() => setAppMode('caregiver')}
          onRefresh={runDiagnostics}
          activePromptReminder={activePromptReminder}
          isPromptModalVisible={isPromptModalVisible}
          onAcknowledgeVoiceModal={handleAcknowledgeVoiceModal}
          onDismissVoiceModal={() => setIsPromptModalVisible(false)}
          onSelectMemoryForView={handleOpenEditMemory}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {/* Caregiver Navigation Header */}
          <View style={styles.caregiverNavBanner}>
            <TouchableOpacity
              style={styles.backToPatientButton}
              onPress={() => setAppMode('patient')}
              activeOpacity={0.8}
            >
              <Text style={styles.backToPatientButtonText}>← Return to Patient View</Text>
            </TouchableOpacity>
            <View style={styles.caregiverBadgePill}>
              <Text style={styles.caregiverBadgeText}>🔒 Caregiver Mode</Text>
            </View>
          </View>

          {/* Caregiver Title Header */}
          <View style={styles.header}>
            <Text style={[Typography.h1, { color: Colors.primary }]}>Caregiver Control Panel</Text>
            <Text style={[Typography.bodyMediumBold, { color: Colors.textSecondary, marginTop: Spacing.xs }]}>
              Manage Memories, Routines & Device Settings
            </Text>
            <Text style={[Typography.caption, { color: Colors.textMuted }]}>
              All photos and audio reminders are stored 100% privately on this device.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md }}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.primary }]}
                onPress={() => speakCalmly('Hello. Welcome back to Memory Lane. Today is a peaceful day.')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>🔊 Voice Test</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.accentWarm }]}
                onPress={handleTriggerTestNotification}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>🔔 Test 5s Alarm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.primary }]}
                onPress={handleOpenTestVoiceModal}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>📢 Alert Modal Test</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.textMuted }]}
                onPress={() => stopSpeaking()}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>⏹ Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
          <>
            {/* Status Log Box */}
            <View style={styles.sectionCard}>
              <Text style={[Typography.h3, { color: Colors.primary, marginBottom: Spacing.sm }]}>
                Diagnostics Log
              </Text>
              {statusLog.map((log, i) => (
                <Text key={i} style={[Typography.caption, { color: Colors.textPrimary, marginVertical: 2 }]}>
                  {log}
                </Text>
              ))}
            </View>

            {/* Time Orientation Header Widget (Phase 4B) */}
            <HeaderTimeWidget />

            {/* Memory Carousel Component (Phase 3B & 3C) */}
            <View style={styles.sectionCard}>
              <View style={styles.rowBetween}>
                <Text style={[Typography.h2, { color: Colors.primary }]}>
                  Memory Carousel
                </Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleOpenAddMemory}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>+ Add Memory</Text>
                </TouchableOpacity>
              </View>
              <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.sm }]}>
                Dementia-friendly cards with voice narration. Tap card or "+ Add Memory" to open Caregiver Editor.
              </Text>

              <MemoryCarousel
                memories={memories}
                onMemoryPress={handleOpenEditMemory}
              />
            </View>

            {/* Memories List */}
            <View style={styles.sectionCard}>
              <View style={styles.rowBetween}>
                <Text style={[Typography.h2, { color: Colors.primary }]}>
                  All Memories in SQLite ({memories.length})
                </Text>
              </View>

              {memories.map((m) => (
                <View key={m.id} style={styles.memoryItem}>
                  <View style={styles.rowBetween}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{m.relationship}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                      <TouchableOpacity
                        style={[styles.miniButton, { backgroundColor: Colors.surfaceElevated, borderColor: Colors.border }]}
                        onPress={() => handleOpenEditMemory(m)}
                        activeOpacity={0.7}
                      >
                        <Text style={[Typography.caption, { color: Colors.primary, fontWeight: '700' }]}>
                          ✏️ Edit
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.miniButton, { backgroundColor: Colors.surfaceElevated, borderColor: Colors.border }]}
                        onPress={() => speakMemory(m.title, m.relationship, m.story)}
                        activeOpacity={0.7}
                      >
                        <Text style={[Typography.caption, { color: Colors.primary, fontWeight: '700' }]}>
                          🔊 Read Aloud
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[Typography.bodyLarge, { color: Colors.textPrimary, fontWeight: '700' }]}>
                    {m.title}
                  </Text>
                  <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: Spacing.xs }]}>
                    {m.story}
                  </Text>
                </View>
              ))}
            </View>

            {/* Reminders Section (Phase 4B & 4D) */}
            <View style={styles.sectionCard}>
              <View style={styles.rowBetween}>
                <Text style={[Typography.h2, { color: Colors.primary }]}>
                  Daily Routine Reminders ({reminders.length})
                </Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleOpenAddReminder}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>+ Add Routine</Text>
                </TouchableOpacity>
              </View>
              <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.md }]}>
                Tap "+ Add Routine" or ✏️ on any card to edit templates, spoken voice instructions & alarm times.
              </Text>

              {reminders.map((r) => (
                <ReminderCard
                  key={r.id}
                  reminder={r}
                  onToggleComplete={handleToggleReminder}
                  onPressEdit={handleOpenEditReminder}
                  showEditButton={true}
                />
              ))}
            </View>
          </>
        </ScrollView>
      )}

      {/* Caregiver Memory Add/Edit Modal (Phase 3C) */}
      <Modal
        visible={isEditorOpen}
        animationType="slide"
        onRequestClose={() => setIsEditorOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <EditMemoryScreen
            memory={selectedMemoryForEdit}
            onSave={handleSaveOrDeleteMemory}
            onCancel={() => setIsEditorOpen(false)}
            onDelete={handleSaveOrDeleteMemory}
          />
        </SafeAreaView>
      </Modal>

      {/* Caregiver Reminder Add/Edit Modal (Phase 4D) */}
      <Modal
        visible={isReminderEditorOpen}
        animationType="slide"
        onRequestClose={() => setIsReminderEditorOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <EditReminderScreen
            reminder={selectedReminderForEdit}
            onSave={handleSaveOrDeleteReminder}
            onCancel={() => setIsReminderEditorOpen(false)}
            onDelete={handleSaveOrDeleteReminder}
          />
        </SafeAreaView>
      </Modal>

      {/* Voice Prompt Alert Modal (Phase 4C) */}
      <VoicePromptModal
        visible={isPromptModalVisible}
        reminder={activePromptReminder}
        onAcknowledge={handleAcknowledgeVoiceModal}
        onDismiss={() => setIsPromptModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  loadingBox: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  actionButtonText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: 15,
  },
  miniButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  memoryItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xs,
  },
  badgeText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  reminderItem: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  caregiverNavBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
  backToPatientButton: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  backToPatientButtonText: {
    ...Typography.button,
    color: Colors.primary,
    fontSize: 16,
  },
  caregiverBadgePill: {
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
});

