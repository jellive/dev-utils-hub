use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "settings.json";

/// Get a single settings value by key.
#[tauri::command]
pub fn settings_get(app: AppHandle, key: String) -> Result<serde_json::Value, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    Ok(store.get(&key).unwrap_or(serde_json::Value::Null))
}

/// Set a single settings value.
#[tauri::command]
pub fn settings_set(
    app: AppHandle,
    key: String,
    value: serde_json::Value,
) -> Result<(), String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    store.set(key, value);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

/// Get all settings as a JSON object.
#[tauri::command]
pub fn settings_get_all(app: AppHandle) -> Result<serde_json::Value, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    let map: serde_json::Map<String, serde_json::Value> = store
        .entries()
        .into_iter()
        .map(|(k, v)| (k, v))
        .collect();
    Ok(serde_json::Value::Object(map))
}

/// Clear all settings from the store.
#[tauri::command]
pub fn settings_reset(app: AppHandle) -> Result<(), String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    store.clear();
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}
