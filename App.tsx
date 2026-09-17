import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
import { VoicePromptModal } from './src/components';
import {
  EditMemoryScreen,
  EditReminderScreen,
  PatientHomeScreen,
  CaregiverDashboardScreen,
  PictureFrameScreen,
} from './src/screens';
import * as ScreenOrientation from 'expo-screen-orientation';

// Configure notification presentation handler
setupNotificationHandler();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [appMode, setAppMode] = useState<'patient' | 'caregiver' | 'frame'>('patient');
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

  // Enforce Portrait lock for Patient and Caregiver views to prevent disorientation from accidental tilts
  useEffect(() => {
    if (appMode !== 'frame') {
      try {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      } catch {
        // Safe fallback on web
      }
    }
  }, [appMode]);

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
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: Spacing.md }]}>
              Loading Memory Lane...
            </Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (appMode === 'frame') {
    return (
      <SafeAreaProvider>
        <View style={styles.frameContainer}>
          <StatusBar hidden={true} />
          <PictureFrameScreen
            memories={memories}
            reminders={reminders}
            onExit={() => setAppMode('patient')}
            onToggleReminder={handleToggleReminder}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />

      {appMode === 'patient' ? (
        <PatientHomeScreen
          memories={memories}
          reminders={reminders}
          onToggleReminder={handleToggleReminder}
          onOpenCaregiverMode={() => setAppMode('caregiver')}
          onOpenPictureFrame={() => setAppMode('frame')}
          onRefresh={runDiagnostics}
          activePromptReminder={activePromptReminder}
          isPromptModalVisible={isPromptModalVisible}
          onAcknowledgeVoiceModal={handleAcknowledgeVoiceModal}
          onDismissVoiceModal={() => setIsPromptModalVisible(false)}
          onSelectMemoryForView={handleOpenEditMemory}
        />
      ) : (
        <CaregiverDashboardScreen
          memories={memories}
          reminders={reminders}
          onReturnToPatientView={() => setAppMode('patient')}
          onOpenPictureFrame={() => setAppMode('frame')}
          onAddMemory={handleOpenAddMemory}
          onEditMemory={handleOpenEditMemory}
          onAddReminder={handleOpenAddReminder}
          onEditReminder={handleOpenEditReminder}
          onToggleReminder={handleToggleReminder}
          onRefreshData={runDiagnostics}
          statusLog={statusLog}
          onTriggerTestAlarm={handleTriggerTestNotification}
          onTriggerTestModal={handleOpenTestVoiceModal}
        />
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  frameContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingBox: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

