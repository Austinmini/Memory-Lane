import { getDatabase, initDatabase } from './database';
import { ReminderRecord } from './types';
import { INITIAL_REMINDERS } from '../constants/defaultData';

export const ReminderRepository = {
  /**
   * Fetch all reminders, ordered by time of day (e.g. 08:30 -> 20:30).
   */
  async getAll(): Promise<ReminderRecord[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ReminderRecord>(
      'SELECT * FROM reminders ORDER BY timeOfDay ASC;'
    );
    return rows;
  },

  /**
   * Fetch only active/enabled reminders.
   */
  async getEnabled(): Promise<ReminderRecord[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ReminderRecord>(
      'SELECT * FROM reminders WHERE isEnabled = 1 ORDER BY timeOfDay ASC;'
    );
    return rows;
  },

  /**
   * Get single reminder by ID.
   */
  async getById(id: string): Promise<ReminderRecord | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ReminderRecord>(
      'SELECT * FROM reminders WHERE id = ?;',
      [id]
    );
    return row ?? null;
  },

  /**
   * Create a new reminder.
   */
  async create(reminder: Omit<ReminderRecord, 'createdAt' | 'updatedAt'>): Promise<ReminderRecord> {
    const db = await getDatabase();
    const now = Date.now();
    const newRecord: ReminderRecord = {
      ...reminder,
      createdAt: now,
      updatedAt: now,
    };

    await db.runAsync(
      `INSERT INTO reminders (id, title, category, timeOfDay, spokenMessage, repeatDaily, isEnabled, isCompletedToday, lastCompletedDate, notificationId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        newRecord.id,
        newRecord.title,
        newRecord.category,
        newRecord.timeOfDay,
        newRecord.spokenMessage,
        newRecord.repeatDaily,
        newRecord.isEnabled,
        newRecord.isCompletedToday,
        newRecord.lastCompletedDate,
        newRecord.notificationId,
        newRecord.createdAt,
        newRecord.updatedAt,
      ]
    );

    return newRecord;
  },

  /**
   * Update existing reminder fields.
   */
  async update(id: string, updates: Partial<Omit<ReminderRecord, 'id' | 'createdAt'>>): Promise<void> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return;

    const merged = { ...existing, ...updates, updatedAt: Date.now() };

    await db.runAsync(
      `UPDATE reminders
       SET title = ?, category = ?, timeOfDay = ?, spokenMessage = ?, repeatDaily = ?, isEnabled = ?, isCompletedToday = ?, lastCompletedDate = ?, notificationId = ?, updatedAt = ?
       WHERE id = ?;`,
      [
        merged.title,
        merged.category,
        merged.timeOfDay,
        merged.spokenMessage,
        merged.repeatDaily,
        merged.isEnabled,
        merged.isCompletedToday,
        merged.lastCompletedDate,
        merged.notificationId,
        merged.updatedAt,
        id,
      ]
    );
  },

  /**
   * Mark reminder as completed for today.
   */
  async markCompleted(id: string, todayDateStr: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE reminders
       SET isCompletedToday = 1, lastCompletedDate = ?, updatedAt = ?
       WHERE id = ?;`,
      [todayDateStr, Date.now(), id]
    );
  },

  /**
   * Reset completion status for reminders if day has rolled over.
   */
  async resetCompletionIfNewDay(todayDateStr: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE reminders
       SET isCompletedToday = 0, updatedAt = ?
       WHERE lastCompletedDate IS NOT NULL AND lastCompletedDate != ?;`,
      [Date.now(), todayDateStr]
    );
  },

  /**
   * Delete a reminder by ID.
   */
  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM reminders WHERE id = ?;', [id]);
  },

  /**
   * Seed default routine reminders if table is empty.
   */
  async seedIfEmpty(): Promise<void> {
    await initDatabase();
    const db = await getDatabase();
    const countResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM reminders;'
    );

    if (countResult && countResult.count === 0) {
      const now = Date.now();
      for (const item of INITIAL_REMINDERS) {
        await db.runAsync(
          `INSERT INTO reminders (id, title, category, timeOfDay, spokenMessage, repeatDaily, isEnabled, isCompletedToday, lastCompletedDate, notificationId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            item.id,
            item.title,
            item.category,
            item.timeOfDay,
            item.spokenMessage,
            item.repeatDaily,
            item.isEnabled,
            item.isCompletedToday,
            null,
            null,
            now,
            now,
          ]
        );
      }
    }
  },
};
