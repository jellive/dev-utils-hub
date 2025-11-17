import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let db: Database.Database | null = null

/**
 * Initialize the SQLite database
 * Database location: userData/history.db
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db
  }

  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'history.db')

  console.log(`📦 Initializing database at: ${dbPath}`)

  try {
    db = new Database(dbPath)

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL')

    // Enable foreign keys
    db.pragma('foreign_keys = ON')

    // Create tables if they don't exist
    createTables()

    console.log('✓ Database initialized successfully')
    return db
  } catch (error) {
    console.error('✗ Failed to initialize database:', error)
    throw error
  }
}

/**
 * Create database tables and indexes
 */
function createTables(): void {
  if (!db) {
    throw new Error('Database not initialized')
  }

  // Create history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool TEXT NOT NULL,
      input TEXT NOT NULL,
      output TEXT,
      metadata TEXT,
      favorite INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `)

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_history_tool ON history(tool);
    CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_history_favorite ON history(favorite);
    CREATE INDEX IF NOT EXISTS idx_history_tool_created ON history(tool, created_at DESC);
  `)

  console.log('✓ Database tables and indexes created')
}

/**
 * Get the database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initializeDatabase()
  }
  return db
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    console.log('✓ Database connection closed')
  }
}

/**
 * Backup the database to a file
 */
export function backupDatabase(backupPath: string): void {
  if (!db) {
    throw new Error('Database not initialized')
  }

  try {
    db.backup(backupPath)
    console.log(`✓ Database backed up to: ${backupPath}`)
  } catch (error) {
    console.error('✗ Failed to backup database:', error)
    throw error
  }
}
