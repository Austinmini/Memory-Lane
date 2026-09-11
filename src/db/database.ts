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

    CREATE INDEX IF NOT EXISTS idx_memories_favorite ON memories (isFavorite DESC, sortOrder ASC);
    CREATE INDEX IF NOT EXISTS idx_reminders_enabled ON reminders (isEnabled, timeOfDay ASC);
  `);

  return db;
}
