import { getDatabase, initDatabase } from './database';
import { MemoryRecord } from './types';
import { INITIAL_MEMORIES } from '../constants/defaultData';

export const MemoryRepository = {
  /**
   * Fetch all memories ordered by favorite status then sort order / creation date.
   */
  async getAll(): Promise<MemoryRecord[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<MemoryRecord>(
      'SELECT * FROM memories ORDER BY isFavorite DESC, sortOrder ASC, createdAt DESC;'
    );
    return rows;
  },

  /**
   * Get single memory by ID.
   */
  async getById(id: string): Promise<MemoryRecord | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<MemoryRecord>(
      'SELECT * FROM memories WHERE id = ?;',
      [id]
    );
    return row ?? null;
  },

  /**
   * Create or replace a memory.
   */
  async create(memory: Omit<MemoryRecord, 'createdAt' | 'updatedAt'>): Promise<MemoryRecord> {
    const db = await getDatabase();
    const now = Date.now();
    const newRecord: MemoryRecord = {
      ...memory,
      createdAt: now,
      updatedAt: now,
    };

    await db.runAsync(
      `INSERT INTO memories (id, title, relationship, story, localImageUri, isFavorite, sortOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        newRecord.id,
        newRecord.title,
        newRecord.relationship,
        newRecord.story,
        newRecord.localImageUri,
        newRecord.isFavorite,
        newRecord.sortOrder,
        newRecord.createdAt,
        newRecord.updatedAt,
      ]
    );

    return newRecord;
  },

  /**
   * Update existing memory fields.
   */
  async update(id: string, updates: Partial<Omit<MemoryRecord, 'id' | 'createdAt'>>): Promise<void> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return;

    const merged = { ...existing, ...updates, updatedAt: Date.now() };

    await db.runAsync(
      `UPDATE memories
       SET title = ?, relationship = ?, story = ?, localImageUri = ?, isFavorite = ?, sortOrder = ?, updatedAt = ?
       WHERE id = ?;`,
      [
        merged.title,
        merged.relationship,
        merged.story,
        merged.localImageUri,
        merged.isFavorite,
        merged.sortOrder,
        merged.updatedAt,
        id,
      ]
    );
  },

  /**
   * Delete a memory by ID.
   */
  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM memories WHERE id = ?;', [id]);
  },

  /**
   * Populate initial memories if table is empty.
   */
  async seedIfEmpty(): Promise<void> {
    await initDatabase();
    const db = await getDatabase();
    const countResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM memories;'
    );

    if (countResult && countResult.count === 0) {
      const now = Date.now();
      for (const item of INITIAL_MEMORIES) {
        await db.runAsync(
          `INSERT INTO memories (id, title, relationship, story, localImageUri, isFavorite, sortOrder, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            item.id,
            item.title,
            item.relationship,
            item.story,
            item.localImageUri,
            item.isFavorite,
            item.sortOrder,
            now,
            now,
          ]
        );
      }
    }
  },
};
