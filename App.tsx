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
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from './src/constants';
import { MemoryRepository, ReminderRepository, MemoryRecord, ReminderRecord } from './src/db';
import { ensureMemoriesDirectoryExists, speakCalmly, speakMemory, stopSpeaking } from './src/services';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [sandboxDir, setSandboxDir] = useState<string>('');

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

      logs.push('🎉 Phase 2 Database & Storage Ready!');
    } catch (err: any) {
      logs.push(`❌ Error: ${err?.message || String(err)}`);
    } finally {
      setStatusLog(logs);
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
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

  const handleAddSampleMemory = async () => {
    const id = `mem_custom_${Date.now()}`;
    await MemoryRepository.create({
      id,
      title: 'Family Gathering',
      relationship: 'Family',
      story: 'A wonderful evening filled with laughter, smiles, and your favorite apple pie.',
      localImageUri: 'seed_custom',
      isFavorite: 1,
      sortOrder: 0,
    });
    const updated = await MemoryRepository.getAll();
    setMemories(updated);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Title Header */}
        <View style={styles.header}>
          <Text style={[Typography.h1, { color: Colors.primary }]}>Memory Lane</Text>
          <Text style={[Typography.bodyMediumBold, { color: Colors.textSecondary, marginTop: Spacing.xs }]}>
            Phase 3A Verification Dashboard
          </Text>
          <Text style={[Typography.caption, { color: Colors.textMuted }]}>
            Local SQLite, Sandbox Storage & Calming Speech (TTS) Active
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.primary }]}
              onPress={() => speakCalmly('Hello. Welcome back to Memory Lane. Today is a peaceful day.')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>🔊 Test Calming Voice</Text>
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

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: Spacing.md }]}>
              Running Local SQLite Migrations...
            </Text>
          </View>
        ) : (
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

            {/* Memories Section */}
            <View style={styles.sectionCard}>
              <View style={styles.rowBetween}>
                <Text style={[Typography.h2, { color: Colors.primary }]}>
                  Memories ({memories.length})
                </Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleAddSampleMemory}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>+ Add Memory</Text>
                </TouchableOpacity>
              </View>

              {memories.map((m) => (
                <View key={m.id} style={styles.memoryItem}>
                  <View style={styles.rowBetween}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{m.relationship}</Text>
                    </View>
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
                  <Text style={[Typography.bodyLarge, { color: Colors.textPrimary, fontWeight: '700' }]}>
                    {m.title}
                  </Text>
                  <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: Spacing.xs }]}>
                    {m.story}
                  </Text>
                </View>
              ))}
            </View>

            {/* Reminders Section */}
            <View style={styles.sectionCard}>
              <Text style={[Typography.h2, { color: Colors.primary, marginBottom: Spacing.sm }]}>
                Daily Routine Reminders ({reminders.length})
              </Text>
              <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: Spacing.md }]}>
                Tap any reminder to toggle SQLite completed state
              </Text>

              {reminders.map((r) => {
                const isDone = !!r.isCompletedToday;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.reminderItem,
                      isDone && { backgroundColor: Colors.successLight, borderColor: Colors.success },
                    ]}
                    onPress={() => handleToggleReminder(r)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={[Typography.h3, { color: Colors.primary }]}>
                        ⏰ {r.timeOfDay}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                        <TouchableOpacity
                          style={[styles.miniButton, { backgroundColor: Colors.surfaceElevated, borderColor: Colors.border }]}
                          onPress={() => speakCalmly(r.spokenMessage)}
                          activeOpacity={0.7}
                        >
                          <Text style={[Typography.caption, { color: Colors.primary, fontWeight: '700' }]}>
                            🔊 Listen
                          </Text>
                        </TouchableOpacity>
                        <View
                          style={[
                            styles.statusPill,
                            { backgroundColor: isDone ? Colors.success : Colors.borderLight },
                          ]}
                        >
                          <Text
                            style={[
                              Typography.badge,
                              { color: isDone ? Colors.textInverse : Colors.textSecondary },
                            ]}
                          >
                            {isDone ? '✓ Completed' : 'Pending'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text
                      style={[
                        Typography.bodyLarge,
                        {
                          color: isDone ? Colors.textSecondary : Colors.textPrimary,
                          fontWeight: '700',
                          marginTop: Spacing.xs,
                          textDecorationLine: isDone ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {r.title}
                    </Text>

                    <Text
                      style={[
                        Typography.body,
                        {
                          color: Colors.textSecondary,
                          marginTop: Spacing.xs,
                          fontStyle: 'italic',
                        },
                      ]}
                    >
                      "{r.spokenMessage}"
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
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
});

