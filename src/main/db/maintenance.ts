import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, copyFileSync } from 'fs'
import { autoCleanup, vacuumDatabase } from './queries'
import { getDatabase, backupDatabase } from './index'

/**
 * Maintenance configuration
 */
interface MaintenanceConfig {
  cleanupIntervalHours: number
  daysToKeep: number
  keepFavorites: boolean
  maxBackups: number
  enableAutoCleanup: boolean
  enablePeriodicBackup: boolean
}

/**
 * Maintenance statistics
 */
interface MaintenanceStats {
  lastCleanup: number | null
  lastBackup: number | null
  recordsDeleted: number
  backupsCreated: number
}

// Default configuration
const DEFAULT_CONFIG: MaintenanceConfig = {
  cleanupIntervalHours: 24,
  daysToKeep: 90,
  keepFavorites: true,
  maxBackups: 5,
  enableAutoCleanup: true,
  enablePeriodicBackup: true
}

// Maintenance state
let cleanupTimer: NodeJS.Timeout | null = null
let backupTimer: NodeJS.Timeout | null = null
let stats: MaintenanceStats = {
  lastCleanup: null,
  lastBackup: null,
  recordsDeleted: 0,
  backupsCreated: 0
}

/**
 * Get backups directory path
 */
function getBackupsDir(): string {
  const userDataPath = app.getPath('userData')
  const backupsDir = join(userDataPath, 'backups')

  // Create backups directory if it doesn't exist
  if (!existsSync(backupsDir)) {
    mkdirSync(backupsDir, { recursive: true })
    console.log(`✓ Created backups directory: ${backupsDir}`)
  }

  return backupsDir
}

/**
 * Create database backup with timestamp
 */
export function createTimestampedBackup(): string {
  const backupsDir = getBackupsDir()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = join(backupsDir, `history-backup-${timestamp}.db`)

  try {
    backupDatabase(backupPath)
    stats.lastBackup = Date.now()
    stats.backupsCreated++

    console.log(`✓ Created backup: ${backupPath}`)

    // Rotate backups
    rotateBackups()

    return backupPath
  } catch (error) {
    console.error('✗ Failed to create backup:', error)
    throw error
  }
}

/**
 * Rotate backups - keep only the most recent N backups
 */
function rotateBackups(): void {
  const backupsDir = getBackupsDir()
  const config = getMaintenanceConfig()

  try {
    // Get all backup files
    const files = readdirSync(backupsDir)
      .filter((file) => file.startsWith('history-backup-') && file.endsWith('.db'))
      .map((file) => ({
        name: file,
        path: join(backupsDir, file),
        mtime: statSync(join(backupsDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.mtime - a.mtime) // Sort by modification time, newest first

    // Delete old backups if we have more than maxBackups
    if (files.length > config.maxBackups) {
      const filesToDelete = files.slice(config.maxBackups)
      filesToDelete.forEach((file) => {
        unlinkSync(file.path)
        console.log(`✓ Deleted old backup: ${file.name}`)
      })

      console.log(`✓ Backup rotation complete: kept ${config.maxBackups}, deleted ${filesToDelete.length}`)
    }
  } catch (error) {
    console.error('✗ Failed to rotate backups:', error)
  }
}

/**
 * Restore database from backup
 */
export function restoreFromBackup(backupPath: string): void {
  if (!existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`)
  }

  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'history.db')

  try {
    // Create a safety backup of current database
    const safetyBackupPath = join(getBackupsDir(), `history-pre-restore-${Date.now()}.db`)
    if (existsSync(dbPath)) {
      copyFileSync(dbPath, safetyBackupPath)
      console.log(`✓ Created safety backup: ${safetyBackupPath}`)
    }

    // Close current database connection
    const db = getDatabase()
    db.close()

    // Copy backup to database location
    copyFileSync(backupPath, dbPath)

    console.log(`✓ Restored database from: ${backupPath}`)
    console.log('⚠️  Application restart required to use restored database')
  } catch (error) {
    console.error('✗ Failed to restore backup:', error)
    throw error
  }
}

/**
 * Get maintenance configuration from app settings
 */
function getMaintenanceConfig(): MaintenanceConfig {
  // TODO: Load from settings when settings system is implemented
  // For now, use default configuration
  return DEFAULT_CONFIG
}

/**
 * Run database cleanup
 */
export function runCleanup(dryRun: boolean = false): number {
  const config = getMaintenanceConfig()

  try {
    console.log(`🔄 Running database cleanup (dryRun: ${dryRun})...`)

    if (dryRun) {
      // In dry-run mode, just count records that would be deleted
      const db = getDatabase()
      const cutoffTimestamp = Math.floor(Date.now() / 1000) - config.daysToKeep * 24 * 60 * 60

      let query = 'SELECT COUNT(*) as count FROM history WHERE created_at < ?'
      const params: any[] = [cutoffTimestamp]

      if (config.keepFavorites) {
        query += ' AND favorite = 0'
      }

      const result = db.prepare(query).get(...params) as { count: number }
      console.log(`ℹ️  Dry-run: Would delete ${result.count} records`)
      return result.count
    }

    // Create backup before cleanup
    if (config.enablePeriodicBackup) {
      createTimestampedBackup()
    }

    // Run actual cleanup
    const deletedCount = autoCleanup(config.daysToKeep, config.keepFavorites)

    // Vacuum database to reclaim space
    vacuumDatabase()

    // Update statistics
    stats.lastCleanup = Date.now()
    stats.recordsDeleted += deletedCount

    console.log(`✓ Cleanup complete: deleted ${deletedCount} records`)
    return deletedCount
  } catch (error) {
    console.error('✗ Cleanup failed:', error)
    throw error
  }
}

/**
 * Initialize maintenance system
 */
export function initializeMaintenance(): void {
  const config = getMaintenanceConfig()

  console.log('🔧 Initializing maintenance system...')
  console.log(`   Cleanup interval: ${config.cleanupIntervalHours} hours`)
  console.log(`   Days to keep: ${config.daysToKeep}`)
  console.log(`   Keep favorites: ${config.keepFavorites}`)
  console.log(`   Max backups: ${config.maxBackups}`)
  console.log(`   Auto cleanup: ${config.enableAutoCleanup}`)
  console.log(`   Periodic backup: ${config.enablePeriodicBackup}`)

  // Create initial backup
  if (config.enablePeriodicBackup) {
    try {
      createTimestampedBackup()
    } catch (error) {
      console.error('⚠️  Failed to create initial backup:', error)
    }
  }

  // Run initial cleanup after a short delay (30 seconds)
  if (config.enableAutoCleanup) {
    setTimeout(() => {
      try {
        runCleanup()
      } catch (error) {
        console.error('⚠️  Initial cleanup failed:', error)
      }
    }, 30 * 1000)
  }

  // Schedule periodic cleanup
  if (config.enableAutoCleanup) {
    const intervalMs = config.cleanupIntervalHours * 60 * 60 * 1000
    cleanupTimer = setInterval(() => {
      try {
        runCleanup()
      } catch (error) {
        console.error('⚠️  Periodic cleanup failed:', error)
      }
    }, intervalMs)

    console.log(`✓ Periodic cleanup scheduled (every ${config.cleanupIntervalHours} hours)`)
  }

  // Schedule periodic backups (every 6 hours)
  if (config.enablePeriodicBackup) {
    const backupIntervalMs = 6 * 60 * 60 * 1000
    backupTimer = setInterval(() => {
      try {
        createTimestampedBackup()
      } catch (error) {
        console.error('⚠️  Periodic backup failed:', error)
      }
    }, backupIntervalMs)

    console.log('✓ Periodic backup scheduled (every 6 hours)')
  }

  console.log('✓ Maintenance system initialized')
}

/**
 * Stop maintenance system
 */
export function stopMaintenance(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
  }

  if (backupTimer) {
    clearInterval(backupTimer)
    backupTimer = null
  }

  console.log('✓ Maintenance system stopped')
}

/**
 * Get maintenance statistics
 */
export function getMaintenanceStats(): MaintenanceStats {
  return { ...stats }
}

/**
 * List available backups
 */
export function listBackups(): Array<{ name: string; path: string; size: number; date: Date }> {
  const backupsDir = getBackupsDir()

  try {
    const files = readdirSync(backupsDir)
      .filter((file) => file.startsWith('history-backup-') && file.endsWith('.db'))
      .map((file) => {
        const filePath = join(backupsDir, file)
        const fileStat = statSync(filePath)
        return {
          name: file,
          path: filePath,
          size: fileStat.size,
          date: fileStat.mtime
        }
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())

    return files
  } catch (error) {
    console.error('✗ Failed to list backups:', error)
    return []
  }
}
