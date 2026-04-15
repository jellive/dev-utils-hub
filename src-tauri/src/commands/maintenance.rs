use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

use crate::Database;

// Maximum number of backup files to retain
const MAX_BACKUPS: usize = 5;
const BACKUP_SUBDIR: &str = "backups";

// ── Helpers ──────────────────────────────────────────────────────────────────

fn backups_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    Ok(data_dir.join(BACKUP_SUBDIR))
}

fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    Ok(data_dir.join("history.db"))
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

// ── Commands ─────────────────────────────────────────────────────────────────

/// Delete old entries. `dry_run = true` returns the count without deleting.
/// Non-favorite entries older than 30 days are removed by default.
#[tauri::command]
pub fn maintenance_cleanup(
    db: State<'_, Database>,
    dry_run: Option<bool>,
) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let dry = dry_run.unwrap_or(false);

    let cutoff_ms = now_ms() - 30i64 * 24 * 60 * 60 * 1000;

    if dry {
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM history WHERE created_at < ?1 AND favorite = 0",
                rusqlite::params![cutoff_ms],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        return Ok(count);
    }

    let affected = conn
        .execute(
            "DELETE FROM history WHERE created_at < ?1 AND favorite = 0",
            rusqlite::params![cutoff_ms],
        )
        .map_err(|e| e.to_string())?;

    Ok(affected as i64)
}

/// Create a timestamped backup of the database.
/// Rotates old backups to keep at most MAX_BACKUPS files.
/// Returns the path of the new backup file.
#[tauri::command]
pub fn maintenance_backup(
    db: State<'_, Database>,
    app: AppHandle,
) -> Result<String, String> {
    let dir = backups_dir(&app)?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let src = db_path(&app)?;
    let ts = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let dest = dir.join(format!("history_{ts}.db"));

    // Use rusqlite's online backup API — lock the connection briefly
    {
        let conn = db.0.lock().map_err(|e| e.to_string())?;
        // WAL checkpoint so the backup file is self-consistent
        conn.execute_batch("PRAGMA wal_checkpoint(FULL);")
            .map_err(|e| e.to_string())?;
    }

    // File copy is safe after WAL checkpoint
    std::fs::copy(&src, &dest).map_err(|e| e.to_string())?;

    // Rotate: remove oldest backups beyond MAX_BACKUPS
    let mut backups: Vec<PathBuf> = std::fs::read_dir(&dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.extension().and_then(|s| s.to_str()) == Some("db"))
        .collect();

    backups.sort(); // lexicographic ≈ chronological since timestamp is in filename

    while backups.len() > MAX_BACKUPS {
        let oldest = backups.remove(0);
        let _ = std::fs::remove_file(oldest);
    }

    dest.to_str()
        .ok_or_else(|| "Invalid path encoding".to_string())
        .map(|s| s.to_string())
}

/// Restore the database from a backup file.
/// Only backups inside the app's backups directory are accepted (path traversal guard).
#[tauri::command]
pub fn maintenance_restore(
    db: State<'_, Database>,
    app: AppHandle,
    backup_path: String,
) -> Result<(), String> {
    let dir = backups_dir(&app)?;
    let src = PathBuf::from(&backup_path);

    // Security: canonicalize and confirm the source is inside the backups dir
    let canonical_src = src
        .canonicalize()
        .map_err(|e| format!("Cannot resolve backup path: {e}"))?;
    let canonical_dir = dir
        .canonicalize()
        .map_err(|e| format!("Cannot resolve backups dir: {e}"))?;

    if !canonical_src.starts_with(&canonical_dir) {
        return Err("Backup file must be inside the app backups directory".to_string());
    }

    let dest = db_path(&app)?;

    // Drop the lock while copying so SQLite isn't confused
    {
        let _conn = db.0.lock().map_err(|e| e.to_string())?;
        std::fs::copy(&canonical_src, &dest).map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Return maintenance/storage statistics.
#[tauri::command]
pub fn maintenance_stats(
    db: State<'_, Database>,
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let total: i64 = conn
        .query_row("SELECT COUNT(*) FROM history", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let oldest: Option<i64> = conn
        .query_row("SELECT MIN(created_at) FROM history", [], |row| row.get(0))
        .unwrap_or(None);

    let newest: Option<i64> = conn
        .query_row("SELECT MAX(created_at) FROM history", [], |row| row.get(0))
        .unwrap_or(None);

    let db_size_bytes: u64 = db_path(&app)
        .ok()
        .and_then(|p| std::fs::metadata(p).ok())
        .map(|m| m.len())
        .unwrap_or(0);

    let backup_count = backups_dir(&app)
        .ok()
        .and_then(|d| std::fs::read_dir(d).ok())
        .map(|iter| {
            iter.filter_map(|e| e.ok())
                .filter(|e| {
                    e.path().extension().and_then(|s| s.to_str()) == Some("db")
                })
                .count()
        })
        .unwrap_or(0);

    Ok(serde_json::json!({
        "total_entries": total,
        "oldest_entry_ms": oldest,
        "newest_entry_ms": newest,
        "db_size_bytes": db_size_bytes,
        "backup_count": backup_count,
    }))
}

/// List all available backup files with name + timestamp metadata.
#[tauri::command]
pub fn maintenance_list_backups(app: AppHandle) -> Result<serde_json::Value, String> {
    let dir = backups_dir(&app)?;

    if !dir.exists() {
        return Ok(serde_json::json!([]));
    }

    let mut backups: Vec<serde_json::Value> = std::fs::read_dir(&dir)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            entry
                .path()
                .extension()
                .and_then(|s| s.to_str())
                == Some("db")
        })
        .filter_map(|entry| {
            let path = entry.path();
            let meta = std::fs::metadata(&path).ok()?;
            let size = meta.len();
            let modified = meta
                .modified()
                .ok()?
                .duration_since(std::time::UNIX_EPOCH)
                .ok()?
                .as_millis() as i64;
            let name = path.file_name()?.to_str()?.to_string();
            let path_str = path.to_str()?.to_string();
            Some(serde_json::json!({
                "name": name,
                "path": path_str,
                "size_bytes": size,
                "modified_ms": modified,
            }))
        })
        .collect();

    // Sort descending (newest first)
    backups.sort_by(|a, b| {
        let a_ts = a["modified_ms"].as_i64().unwrap_or(0);
        let b_ts = b["modified_ms"].as_i64().unwrap_or(0);
        b_ts.cmp(&a_ts)
    });

    Ok(serde_json::json!(backups))
}
