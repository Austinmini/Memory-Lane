import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'memory_lane.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Returns a singleton open SQLite database instance.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return dbInstance;
}

/**
 * Initializes the SQLite database and runs table creation migrations.
 * Enables WAL mode for high-performance offline concurrent reads.
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await getDatabase();

  // Enable WAL (Write-Ahead Logging) and Foreign Keys
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      relationship TEXT NOT NULL,
      story TEXT NOT NULL,
      localImageUri TEXT NOT NULL,
      isFavorite INTEGER NOT NULL DEFAULT 0,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      timeOfDay TEXT NOT NULL,
      spokenMessage TEXT NOT NULL,
      repeatDaily INTEGER NOT NULL DEFAULT 1,
      isEnabled INTEGER NOT NULL DEFAULT 1,
      isCompletedToday INTEGER NOT NULL DEFAULT 0,
      lastCompletedDate TEXT,
      notificationId TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_memories_favorite ON memories (isFavorite DESC, sortOrder ASC);
    CREATE INDEX IF NOT EXISTS idx_reminders_enabled ON reminders (isEnabled, timeOfDay ASC);
  `);

  return db;
}

/**
 * Retrieves a persistent string setting from app_settings.
 */
export async function getSetting(key: string, defaultValue?: string): Promise<string | undefined> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?;',
      [key]
    );
    return row ? row.value : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Persists a key-value setting in app_settings.
 */
export async function setSetting(key: string, value: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);',
      [key, value]
    );
  } catch (err) {
    console.warn('Failed to save setting', key, err);
  }
}
