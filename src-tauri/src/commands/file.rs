use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, FilePath};

/// Save `content` to a file chosen via a native save dialog.
/// Returns the path that was written, or an error string.
#[tauri::command]
pub async fn file_save(
    app: AppHandle,
    content: String,
    default_path: Option<String>,
) -> Result<String, String> {
    let mut builder = app.dialog().file();

    if let Some(path) = default_path {
        builder = builder.set_file_name(&path);
    }

    let file_path = builder
        .blocking_save_file()
        .ok_or_else(|| "Save dialog cancelled".to_string())?;

    let path_str = match &file_path {
        FilePath::Path(p) => p
            .to_str()
            .ok_or_else(|| "Invalid path encoding".to_string())?
            .to_string(),
        _ => return Err("Unsupported file path type".to_string()),
    };

    std::fs::write(&path_str, content.as_bytes())
        .map_err(|e| e.to_string())?;

    Ok(path_str)
}

/// Open a file chosen via a native open dialog.
/// Returns `{ path, content }` JSON.
#[tauri::command]
pub async fn file_open(app: AppHandle) -> Result<serde_json::Value, String> {
    let file_path = app
        .dialog()
        .file()
        .blocking_pick_file()
        .ok_or_else(|| "Open dialog cancelled".to_string())?;

    let path_str = match &file_path {
        FilePath::Path(p) => p
            .to_str()
            .ok_or_else(|| "Invalid path encoding".to_string())?
            .to_string(),
        _ => return Err("Unsupported file path type".to_string()),
    };

    let content = std::fs::read_to_string(&path_str).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "path": path_str,
        "content": content,
    }))
}
