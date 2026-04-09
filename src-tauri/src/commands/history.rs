use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::Database;

// ── Data types ─────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: i64,
    pub tool: String,
    pub input: String,
    pub output: Option<String>,
    pub metadata: Option<String>,
    pub favorite: bool,
    pub created_at: i64,
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/// Map a rusqlite `Row` to `HistoryEntry`.
fn row_to_entry(row: &rusqlite::Row<'_>) -> rusqlite::Result<HistoryEntry> {
    Ok(HistoryEntry {
        id: row.get(0)?,
        tool: row.get(1)?,
        input: row.get(2)?,
        output: row.get(3)?,
        metadata: row.get(4)?,
        favorite: row.get::<_, i64>(5)? != 0,
        created_at: row.get(6)?,
    })
}

// ── Commands ─────────────────────────────────────────────────────────────────

/// Save a history entry and return its row id.
#[tauri::command]
pub fn history_save(
    db: State<'_, Database>,
    tool: String,
    input: String,
    output: Option<String>,
    metadata: Option<String>,
) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO history (tool, input, output, metadata) VALUES (?1, ?2, ?3, ?4)",
        params![tool, input, output, metadata],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

/// Get recent history entries, optionally filtered by tool.
#[tauri::command]
pub fn history_get(
    db: State<'_, Database>,
    tool: Option<String>,
    limit: Option<u32>,
) -> Result<Vec<HistoryEntry>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let limit = limit.unwrap_or(50);

    let entries = if let Some(t) = tool {
        let mut stmt = conn
            .prepare(
                "SELECT id, tool, input, output, metadata, favorite, created_at
                 FROM history WHERE tool = ?1
                 ORDER BY created_at DESC LIMIT ?2",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![t, limit], row_to_entry)
            .map_err(|e| e.to_string())?
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())?;
        rows
    } else {
        let mut stmt = conn
            .prepare(
                "SELECT id, tool, input, output, metadata, favorite, created_at
                 FROM history ORDER BY created_at DESC LIMIT ?1",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![limit], row_to_entry)
            .map_err(|e| e.to_string())?
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())?;
        rows
    };
    Ok(entries)
}

/// Get history with full filter/pagination options.
#[tauri::command]
pub fn history_get_with_options(
    db: State<'_, Database>,
    tool: String,
    limit: Option<u32>,
    offset: Option<u32>,
    favorites: Option<bool>,
    start_date: Option<i64>,
    end_date: Option<i64>,
) -> Result<Vec<HistoryEntry>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    // Build dynamic WHERE clause
    let mut conditions = vec!["tool = ?1".to_string()];
    if favorites.unwrap_or(false) {
        conditions.push("favorite = 1".to_string());
    }
    if start_date.is_some() {
        conditions.push("created_at >= ?5".to_string());
    }
    if end_date.is_some() {
        conditions.push("created_at <= ?6".to_string());
    }

    let sql = format!(
        "SELECT id, tool, input, output, metadata, favorite, created_at
         FROM history WHERE {}
         ORDER BY created_at DESC LIMIT ?2 OFFSET ?3",
        conditions.join(" AND ")
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    // rusqlite named params via positional — bind all slots defensively
    let entries = stmt
        .query_map(
            params![
                tool,
                limit,
                offset,
                rusqlite::types::Null, // slot 4 unused
                start_date.unwrap_or(0),
                end_date.unwrap_or(i64::MAX),
            ],
            row_to_entry,
        )
        .map_err(|e| e.to_string())?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())?;

    Ok(entries)
}

/// Count entries for a tool.
#[tauri::command]
pub fn history_count(db: State<'_, Database>, tool: String) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM history WHERE tool = ?1",
            params![tool],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    Ok(count)
}

/// Full-text search across input/output for a tool.
#[tauri::command]
pub fn history_search(
    db: State<'_, Database>,
    tool: String,
    query: String,
    limit: Option<u32>,
) -> Result<Vec<HistoryEntry>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let limit = limit.unwrap_or(50);
    let pattern = format!("%{}%", query);

    let mut stmt = conn
        .prepare(
            "SELECT id, tool, input, output, metadata, favorite, created_at
             FROM history
             WHERE tool = ?1 AND (input LIKE ?2 OR output LIKE ?2)
             ORDER BY created_at DESC LIMIT ?3",
        )
        .map_err(|e| e.to_string())?;

    let entries = stmt
        .query_map(params![tool, pattern, limit], row_to_entry)
        .map_err(|e| e.to_string())?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())?;

    Ok(entries)
}

/// Get a single entry by id.
#[tauri::command]
pub fn history_get_by_id(
    db: State<'_, Database>,
    id: i64,
) -> Result<Option<HistoryEntry>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let result = conn.query_row(
        "SELECT id, tool, input, output, metadata, favorite, created_at
         FROM history WHERE id = ?1",
        params![id],
        row_to_entry,
    );
    match result {
        Ok(entry) => Ok(Some(entry)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Delete an entry by id. Returns true if a row was deleted.
#[tauri::command]
pub fn history_delete(db: State<'_, Database>, id: i64) -> Result<bool, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute("DELETE FROM history WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(affected > 0)
}

/// Toggle the favorite flag for an entry. Returns the new favorite state.
#[tauri::command]
pub fn history_toggle_favorite(db: State<'_, Database>, id: i64) -> Result<bool, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let current: i64 = conn
        .query_row(
            "SELECT favorite FROM history WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let new_val = if current == 0 { 1i64 } else { 0i64 };
    conn.execute(
        "UPDATE history SET favorite = ?1 WHERE id = ?2",
        params![new_val, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(new_val != 0)
}

/// Clear all entries for a specific tool. Returns deleted count.
#[tauri::command]
pub fn history_clear(db: State<'_, Database>, tool: String) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute("DELETE FROM history WHERE tool = ?1", params![tool])
        .map_err(|e| e.to_string())?;
    Ok(affected as i64)
}

/// Clear all history. Returns deleted count.
#[tauri::command]
pub fn history_clear_all(db: State<'_, Database>) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let affected = conn
        .execute("DELETE FROM history", [])
        .map_err(|e| e.to_string())?;
    Ok(affected as i64)
}

/// Delete entries older than `days_old` days, optionally preserving favorites.
/// Returns deleted count.
#[tauri::command]
pub fn history_auto_cleanup(
    db: State<'_, Database>,
    days_old: Option<u32>,
    keep_favorites: Option<bool>,
) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let days = days_old.unwrap_or(30) as i64;
    let keep_favs = keep_favorites.unwrap_or(true);

    // cutoff in milliseconds
    let cutoff_ms = {
        let now_ms = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_millis() as i64;
        now_ms - days * 24 * 60 * 60 * 1000
    };

    let affected = if keep_favs {
        conn.execute(
            "DELETE FROM history WHERE created_at < ?1 AND favorite = 0",
            params![cutoff_ms],
        )
    } else {
        conn.execute(
            "DELETE FROM history WHERE created_at < ?1",
            params![cutoff_ms],
        )
    }
    .map_err(|e| e.to_string())?;

    Ok(affected as i64)
}

/// Return aggregate stats for the history table.
#[tauri::command]
pub fn history_stats(db: State<'_, Database>) -> Result<serde_json::Value, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let total: i64 = conn
        .query_row("SELECT COUNT(*) FROM history", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let favorites: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM history WHERE favorite = 1",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // Per-tool counts
    let mut stmt = conn
        .prepare("SELECT tool, COUNT(*) FROM history GROUP BY tool ORDER BY COUNT(*) DESC")
        .map_err(|e| e.to_string())?;
    let by_tool: serde_json::Map<String, serde_json::Value> = stmt
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?)))
        .map_err(|e| e.to_string())?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(|(k, v)| (k, serde_json::Value::Number(v.into())))
        .collect();

    Ok(serde_json::json!({
        "total": total,
        "favorites": favorites,
        "by_tool": by_tool,
    }))
}
