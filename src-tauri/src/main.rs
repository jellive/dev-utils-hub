// Prevents an additional console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod menu;
mod tray;

use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_autostart::MacosLauncher;

// ── Shared state ─────────────────────────────────────────────────────────────

/// Thread-safe wrapper around the SQLite connection.
pub struct Database(pub Mutex<rusqlite::Connection>);

// ── Entry point ───────────────────────────────────────────────────────────────

fn main() {
    tauri::Builder::default()
        // ── Plugins ──────────────────────────────────────────────────────────
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        // .plugin(tauri_plugin_updater::Builder::default().build()) // TODO: enable after configuring pubkey+endpoints
        // ── App setup ────────────────────────────────────────────────────────
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data directory");

            std::fs::create_dir_all(&data_dir)
                .expect("Failed to create app data directory");

            let db_path = data_dir.join("history.db");
            let conn = db::open(&db_path).expect("Failed to open SQLite database");

            app.manage(Database(Mutex::new(conn)));

            // Menu and tray
            let handle = app.handle().clone();
            let app_menu = menu::create_menu(&handle)?;
            app.set_menu(app_menu)?;
            app.on_menu_event(|app, event| {
                menu::handle_menu_event(app, &event);
            });
            tray::create_tray(&handle)?;

            Ok(())
        })
        // ── IPC handlers ─────────────────────────────────────────────────────
        .invoke_handler(tauri::generate_handler![
            // history
            commands::history::history_save,
            commands::history::history_get,
            commands::history::history_get_with_options,
            commands::history::history_count,
            commands::history::history_search,
            commands::history::history_get_by_id,
            commands::history::history_delete,
            commands::history::history_toggle_favorite,
            commands::history::history_clear,
            commands::history::history_clear_all,
            commands::history::history_auto_cleanup,
            commands::history::history_stats,
            // maintenance
            commands::maintenance::maintenance_cleanup,
            commands::maintenance::maintenance_backup,
            commands::maintenance::maintenance_restore,
            commands::maintenance::maintenance_stats,
            commands::maintenance::maintenance_list_backups,
            // settings
            commands::settings::settings_get,
            commands::settings::settings_set,
            commands::settings::settings_get_all,
            commands::settings::settings_reset,
            // clipboard
            commands::clipboard::clipboard_read_text,
            commands::clipboard::clipboard_write_text,
            // file
            commands::file::file_save,
            commands::file::file_open,
            // encoding / hashing (Rust-accelerated)
            commands::encoding::encode_base64,
            commands::encoding::encode_base64_url,
            commands::encoding::decode_base64,
            commands::encoding::decode_base64_url,
            commands::encoding::hash_md5,
            commands::encoding::hash_sha256,
            commands::encoding::hash_sha512,
            commands::encoding::hash_hmac,
            // app info
            commands::app::get_app_version,
            commands::app::get_platform_info,
            // dpi probe
            commands::dpi_probe::probe_native,
            commands::dpi_probe::probe_curl,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Dev Utils Hub");
}
