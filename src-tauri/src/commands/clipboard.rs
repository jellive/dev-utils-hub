// Clipboard is handled on the frontend via @tauri-apps/plugin-clipboard-manager.
// These Rust-side stubs exist so the module compiles and can be extended later
// without requiring frontend changes.

use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;

/// Read text from the system clipboard.
#[tauri::command]
pub fn clipboard_read_text(app: AppHandle) -> Result<String, String> {
    app.clipboard()
        .read_text()
        .map_err(|e| e.to_string())
}

/// Write text to the system clipboard.
#[tauri::command]
pub fn clipboard_write_text(app: AppHandle, text: String) -> Result<(), String> {
    app.clipboard()
        .write_text(text)
        .map_err(|e| e.to_string())
}
