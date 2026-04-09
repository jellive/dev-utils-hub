use tauri::AppHandle;

/// Return the app version string from Cargo.toml / tauri.conf.json.
#[tauri::command]
pub fn get_app_version(app: AppHandle) -> Result<String, String> {
    Ok(app.package_info().version.to_string())
}

/// Return platform and CPU architecture info.
#[tauri::command]
pub fn get_platform_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
    }))
}
