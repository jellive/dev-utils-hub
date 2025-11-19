import { getDatabase } from './index'

/**
 * History entry interface
 */
export interface HistoryEntry {
  id?: number
  tool: string
  input: string
  output?: string
  metadata?: string
  favorite?: number
  created_at?: number
}

/**
 * Options for getting history with filtering
 */
export interface GetHistoryOptions {
  limit?: number
  offset?: number
  favorites?: boolean
  startDate?: number
  endDate?: number
}

/**
 * Database operation result interface
 */
export interface DbOperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
  retried?: boolean
}

/**
 * Retry database operation with exponential backoff
 */
function retryOperation<T>(
  operation: () => T,
  maxRetries: number = 3,
  initialDelay: number = 100
): DbOperationResult<T> {
  let lastError: Error | null = null
  let delay = initialDelay

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = operation()
      return {
        success: true,
        data: result,
        retried: attempt > 0
      }
    } catch (error: any) {
      lastError = error

      // Only retry on SQLITE_BUSY errors
      if (error.code === 'SQLITE_BUSY' && attempt < maxRetries - 1) {
        console.warn(`⚠️  Database busy, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)

        // Exponential backoff with jitter
        const jitter = Math.random() * delay * 0.1
        const sleepTime = delay + jitter

        // Busy wait (blocking) since we're in synchronous context
        const start = Date.now()
        while (Date.now() - start < sleepTime) {
          // Busy wait
        }

        delay *= 2
        continue
      }

      break
    }
  }

  console.error('✗ Database operation failed after retries:', lastError)
  return {
    success: false,
    error: lastError?.message || 'Unknown database error'
  }
}

/**
 * Validate and parse metadata JSON
 */
function validateMetadata(metadata?: Record<string, any>): string | null {
  if (!metadata) return null

  try {
    const json = JSON.stringify(metadata)
    // Validate by parsing it back
    JSON.parse(json)
    return json
  } catch (error) {
    console.error('✗ Invalid metadata JSON:', error)
    throw new Error('Metadata must be a valid JSON object')
  }
}

/**
 * Save a new history entry with transaction safety
 */
export function saveHistory(
  tool: string,
  input: string,
  output?: string,
  metadata?: Record<string, any>
): number {
  const result = retryOperation(() => {
    const db = getDatabase()
    const metadataJson = validateMetadata(metadata)

    const stmt = db.prepare(`
      INSERT INTO history (tool, input, output, metadata)
      VALUES (?, ?, ?, ?)
    `)

    const insertResult = stmt.run(tool, input, output || null, metadataJson)
    return insertResult.lastInsertRowid as number
  })

  if (!result.success) {
    throw new Error(`Failed to save history: ${result.error}`)
  }

  console.log(`✓ History saved: ${tool} (id: ${result.data})${result.retried ? ' (retried)' : ''}`)
  return result.data!
}

/**
 * Save multiple history entries in a single transaction
 */
export function saveBatchHistory(
  entries: Array<{
    tool: string
    input: string
    output?: string
    metadata?: Record<string, any>
  }>
): number[] {
  const result = retryOperation(() => {
    const db = getDatabase()
    const ids: number[] = []

    // Use transaction for atomic batch insert
    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO history (tool, input, output, metadata)
        VALUES (?, ?, ?, ?)
      `)

      for (const entry of entries) {
        const metadataJson = validateMetadata(entry.metadata)
        const insertResult = stmt.run(
          entry.tool,
          entry.input,
          entry.output || null,
          metadataJson
        )
        ids.push(insertResult.lastInsertRowid as number)
      }
    })

    transaction()
    return ids
  })

  if (!result.success) {
    throw new Error(`Failed to save batch history: ${result.error}`)
  }

  console.log(
    `✓ Batch history saved: ${result.data!.length} entries${result.retried ? ' (retried)' : ''}`
  )
  return result.data!
}

/**
 * Get history entries for a specific tool
 */
export function getHistory(tool?: string, limit: number = 50): HistoryEntry[] {
  const db = getDatabase()

  let query = `
    SELECT id, tool, input, output, metadata, favorite, created_at
    FROM history
  `

  const params: any[] = []

  if (tool) {
    query += ' WHERE tool = ?'
    params.push(tool)
  }

  query += ' ORDER BY created_at DESC LIMIT ?'
  params.push(limit)

  const stmt = db.prepare(query)
  const rows = stmt.all(...params) as HistoryEntry[]

  console.log(`✓ Retrieved ${rows.length} history entries${tool ? ` for ${tool}` : ''}`)
  return rows
}

/**
 * Get history entries with advanced filtering options
 */
export function getHistoryWithOptions(tool: string, options: GetHistoryOptions = {}): HistoryEntry[] {
  const db = getDatabase()

  const {
    limit = 50,
    offset = 0,
    favorites,
    startDate,
    endDate
  } = options

  let query = `
    SELECT id, tool, input, output, metadata, favorite, created_at
    FROM history
    WHERE tool = ?
  `
  const params: any[] = [tool]

  // Add favorites filter
  if (favorites !== undefined) {
    query += ' AND favorite = ?'
    params.push(favorites ? 1 : 0)
  }

  // Add date range filters
  if (startDate !== undefined) {
    query += ' AND created_at >= ?'
    params.push(startDate)
  }

  if (endDate !== undefined) {
    query += ' AND created_at <= ?'
    params.push(endDate)
  }

  // Add ordering and pagination
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const stmt = db.prepare(query)
  const rows = stmt.all(...params) as HistoryEntry[]

  console.log(`✓ Retrieved ${rows.length} history entries for ${tool} with options`)
  return rows
}

/**
 * Get count of history entries for a specific tool
 */
export function getHistoryCount(tool: string): number {
  const db = getDatabase()

  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM history
    WHERE tool = ?
  `)

  const result = stmt.get(tool) as { count: number }
  const count = result.count

  console.log(`✓ History count for ${tool}: ${count}`)
  return count
}

/**
 * Search history entries
 */
export function searchHistory(tool: string, query: string, limit: number = 50): HistoryEntry[] {
  const db = getDatabase()

  const stmt = db.prepare(`
    SELECT id, tool, input, output, metadata, favorite, created_at
    FROM history
    WHERE tool = ? AND (input LIKE ? OR output LIKE ?)
    ORDER BY created_at DESC
    LIMIT ?
  `)

  const searchPattern = `%${query}%`
  const rows = stmt.all(tool, searchPattern, searchPattern, limit) as HistoryEntry[]

  console.log(`✓ Search found ${rows.length} entries for "${query}" in ${tool}`)
  return rows
}

/**
 * Get a single history entry by ID
 */
export function getHistoryById(id: number): HistoryEntry | undefined {
  const db = getDatabase()

  const stmt = db.prepare(`
    SELECT id, tool, input, output, metadata, favorite, created_at
    FROM history
    WHERE id = ?
  `)

  const row = stmt.get(id) as HistoryEntry | undefined
  return row
}

/**
 * Delete a history entry
 */
export function deleteHistory(id: number): boolean {
  const db = getDatabase()

  const stmt = db.prepare('DELETE FROM history WHERE id = ?')
  const result = stmt.run(id)

  const deleted = result.changes > 0
  if (deleted) {
    console.log(`✓ History entry deleted: ${id}`)
  } else {
    console.warn(`⚠️  History entry not found: ${id}`)
  }

  return deleted
}

/**
 * Toggle favorite status of a history entry
 */
export function toggleFavorite(id: number): boolean {
  const db = getDatabase()

  // First, get current favorite status
  const current = db.prepare('SELECT favorite FROM history WHERE id = ?').get(id) as
    | { favorite: number }
    | undefined

  if (!current) {
    console.warn(`⚠️  History entry not found: ${id}`)
    return false
  }

  // Toggle favorite status
  const newFavorite = current.favorite === 1 ? 0 : 1
  const stmt = db.prepare('UPDATE history SET favorite = ? WHERE id = ?')
  const result = stmt.run(newFavorite, id)

  const updated = result.changes > 0
  if (updated) {
    console.log(`✓ Favorite toggled for history entry ${id}: ${newFavorite === 1 ? 'ON' : 'OFF'}`)
  }

  return updated
}

/**
 * Clear all history for a specific tool
 */
export function clearHistory(tool: string): number {
  const db = getDatabase()

  const stmt = db.prepare('DELETE FROM history WHERE tool = ?')
  const result = stmt.run(tool)

  console.log(`✓ Cleared ${result.changes} history entries for ${tool}`)
  return result.changes
}

/**
 * Clear all history
 */
export function clearAllHistory(): number {
  const db = getDatabase()

  const stmt = db.prepare('DELETE FROM history')
  const result = stmt.run()

  console.log(`✓ Cleared all history: ${result.changes} entries`)
  return result.changes
}

/**
 * Auto-cleanup old history entries
 * @param daysOld Number of days to keep (default: 90)
 * @param keepFavorites Whether to keep favorite entries (default: true)
 */
export function autoCleanup(daysOld: number = 90, keepFavorites: boolean = true): number {
  const db = getDatabase()

  const cutoffTimestamp = Math.floor(Date.now() / 1000) - daysOld * 24 * 60 * 60

  let query = 'DELETE FROM history WHERE created_at < ?'
  const params: any[] = [cutoffTimestamp]

  if (keepFavorites) {
    query += ' AND favorite = 0'
  }

  const stmt = db.prepare(query)
  const result = stmt.run(...params)

  console.log(`✓ Auto-cleanup removed ${result.changes} entries older than ${daysOld} days`)
  return result.changes
}

/**
 * Get history statistics
 */
export function getHistoryStats(): {
  total: number
  byTool: Record<string, number>
  favorites: number
  oldestEntry: number | null
  newestEntry: number | null
} {
  const db = getDatabase()

  // Total count
  const totalRow = db.prepare('SELECT COUNT(*) as count FROM history').get() as { count: number }
  const total = totalRow.count

  // Count by tool
  const byToolRows = db
    .prepare('SELECT tool, COUNT(*) as count FROM history GROUP BY tool')
    .all() as Array<{ tool: string; count: number }>

  const byTool: Record<string, number> = {}
  byToolRows.forEach((row) => {
    byTool[row.tool] = row.count
  })

  // Favorites count
  const favoritesRow = db
    .prepare('SELECT COUNT(*) as count FROM history WHERE favorite = 1')
    .get() as { count: number }
  const favorites = favoritesRow.count

  // Oldest and newest entries
  const oldestRow = db.prepare('SELECT MIN(created_at) as oldest FROM history').get() as {
    oldest: number | null
  }
  const newestRow = db.prepare('SELECT MAX(created_at) as newest FROM history').get() as {
    newest: number | null
  }

  return {
    total,
    byTool,
    favorites,
    oldestEntry: oldestRow.oldest,
    newestEntry: newestRow.newest
  }
}

/**
 * Check database integrity
 */
export function checkDatabaseIntegrity(): DbOperationResult<boolean> {
  try {
    const db = getDatabase()
    const result = db.pragma('integrity_check') as Array<{ integrity_check: string }>

    const isHealthy = result.length === 1 && result[0].integrity_check === 'ok'

    if (isHealthy) {
      console.log('✓ Database integrity check passed')
    } else {
      console.error('✗ Database integrity check failed:', result)
    }

    return {
      success: true,
      data: isHealthy
    }
  } catch (error: any) {
    console.error('✗ Failed to check database integrity:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Check database connection health
 */
export function checkDatabaseHealth(): DbOperationResult<boolean> {
  try {
    const db = getDatabase()

    // Simple query to verify connection
    const result = db.prepare('SELECT 1 as ping').get() as { ping: number } | undefined

    const isHealthy = result?.ping === 1

    if (!isHealthy) {
      console.error('✗ Database health check failed: unexpected result')
    }

    return {
      success: true,
      data: isHealthy
    }
  } catch (error: any) {
    console.error('✗ Database health check failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Optimize database with VACUUM
 */
export function vacuumDatabase(): DbOperationResult<void> {
  try {
    const db = getDatabase()
    db.exec('VACUUM')

    console.log('✓ Database vacuumed successfully')
    return {
      success: true
    }
  } catch (error: any) {
    console.error('✗ Failed to vacuum database:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
