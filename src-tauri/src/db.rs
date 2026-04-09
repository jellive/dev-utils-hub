use rusqlite::{Connection, Result as SqliteResult};
use std::path::Path;

pub fn open(db_path: &Path) -> SqliteResult<Connection> {
    let conn = Connection::open(db_path)?;
    initialize(&conn)?;
    Ok(conn)
}

fn initialize(conn: &Connection) -> SqliteResult<()> {
    // Performance settings matching Electron better-sqlite3 defaults
    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
    conn.execute_batch("PRAGMA foreign_keys=ON;")?;
    conn.execute_batch("PRAGMA busy_timeout=5000;")?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            tool        TEXT    NOT NULL,
            input       TEXT    NOT NULL,
            output      TEXT,
            metadata    TEXT,
            favorite    INTEGER DEFAULT 0,
            created_at  INTEGER NOT NULL
                        DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
        );
        CREATE INDEX IF NOT EXISTS idx_history_tool
            ON history(tool);
        CREATE INDEX IF NOT EXISTS idx_history_created_at
            ON history(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_history_favorite
            ON history(favorite);
        CREATE INDEX IF NOT EXISTS idx_history_tool_created
            ON history(tool, created_at DESC);",
    )?;

    Ok(())
}
