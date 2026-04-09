use tauri::image::Image;
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager};

pub fn create_tray(app: &AppHandle) -> tauri::Result<()> {
    // ── Quick Tools submenu ───────────────────────────────────────────────────
    let uuid_tool = MenuItemBuilder::new("UUID Generator")
        .id("tool-uuid")
        .build(app)?;

    let json_tool = MenuItemBuilder::new("JSON Formatter")
        .id("tool-json")
        .build(app)?;

    let base64_tool = MenuItemBuilder::new("Base64 Converter")
        .id("tool-base64")
        .build(app)?;

    let hash_tool = MenuItemBuilder::new("Hash Generator")
        .id("tool-hash")
        .build(app)?;

    let url_tool = MenuItemBuilder::new("URL Encoder")
        .id("tool-url")
        .build(app)?;

    let quick_tools = SubmenuBuilder::new(app, "Quick Tools")
        .item(&uuid_tool)
        .item(&json_tool)
        .item(&base64_tool)
        .item(&hash_tool)
        .item(&url_tool)
        .build()?;

    // ── Main tray menu ────────────────────────────────────────────────────────
    let toggle_window = MenuItemBuilder::new("Show/Hide Dev Utils Hub")
        .id("toggle-window")
        .build(app)?;

    let sep1 = tauri::menu::PredefinedMenuItem::separator(app)?;

    let sep2 = tauri::menu::PredefinedMenuItem::separator(app)?;

    let view_history = MenuItemBuilder::new("View History")
        .id("view-history")
        .build(app)?;

    let settings = MenuItemBuilder::new("Settings")
        .id("tray-settings")
        .build(app)?;

    let sep3 = tauri::menu::PredefinedMenuItem::separator(app)?;

    let quit = MenuItemBuilder::new("Quit Dev Utils Hub")
        .id("tray-quit")
        .build(app)?;

    let tray_menu = MenuBuilder::new(app)
        .item(&toggle_window)
        .item(&sep1)
        .item(&quick_tools)
        .item(&sep2)
        .item(&view_history)
        .item(&settings)
        .item(&sep3)
        .item(&quit)
        .build()?;

    // ── Build tray icon ───────────────────────────────────────────────────────
    let icon = Image::from_bytes(include_bytes!("../icons/32x32.png"))?;

    TrayIconBuilder::new()
        .tooltip("Dev Utils Hub")
        .icon(icon)
        .menu(&tray_menu)
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "toggle-window" => {
                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            window.hide().ok();
                        } else {
                            window.show().ok();
                            window.set_focus().ok();
                        }
                    }
                }
                "tool-uuid" => {
                    app.emit("navigate-to-tool", "/uuid").ok();
                    show_and_focus(app);
                }
                "tool-json" => {
                    app.emit("navigate-to-tool", "/json").ok();
                    show_and_focus(app);
                }
                "tool-base64" => {
                    app.emit("navigate-to-tool", "/base64").ok();
                    show_and_focus(app);
                }
                "tool-hash" => {
                    app.emit("navigate-to-tool", "/hash").ok();
                    show_and_focus(app);
                }
                "tool-url" => {
                    app.emit("navigate-to-tool", "/url").ok();
                    show_and_focus(app);
                }
                "view-history" => {
                    app.emit("shortcut:toggle-history", ()).ok();
                    show_and_focus(app);
                }
                "tray-settings" => {
                    app.emit("navigate-to", "/settings").ok();
                    show_and_focus(app);
                }
                "tray-quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}

fn show_and_focus(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        window.show().ok();
        window.set_focus().ok();
    }
}
