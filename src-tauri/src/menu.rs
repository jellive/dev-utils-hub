use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
use tauri::{AppHandle, Emitter, Manager, Wry};

pub fn create_menu(app: &AppHandle) -> tauri::Result<tauri::menu::Menu<Wry>> {
    // ── Edit menu items ───────────────────────────────────────────────────────
    let undo = PredefinedMenuItem::undo(app, None)?;
    let redo = PredefinedMenuItem::redo(app, None)?;
    let cut = PredefinedMenuItem::cut(app, None)?;
    let copy = PredefinedMenuItem::copy(app, None)?;
    let paste = PredefinedMenuItem::paste(app, None)?;
    let select_all = PredefinedMenuItem::select_all(app, None)?;
    let separator = PredefinedMenuItem::separator(app)?;

    // ── File menu ─────────────────────────────────────────────────────────────
    let export_history = MenuItemBuilder::new("Export History...")
        .accelerator("CmdOrCtrl+E")
        .id("export-history")
        .build(app)?;

    let import_history = MenuItemBuilder::new("Import History...")
        .accelerator("CmdOrCtrl+I")
        .id("import-history")
        .build(app)?;

    #[cfg(not(target_os = "macos"))]
    let file_sep = PredefinedMenuItem::separator(app)?;

    #[cfg(not(target_os = "macos"))]
    let file_quit = MenuItemBuilder::new("Quit")
        .accelerator("CmdOrCtrl+Q")
        .id("file-quit")
        .build(app)?;

    #[cfg(not(target_os = "macos"))]
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&export_history)
        .item(&import_history)
        .item(&file_sep)
        .item(&file_quit)
        .build()?;

    #[cfg(target_os = "macos")]
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&export_history)
        .item(&import_history)
        .build()?;

    // ── Edit menu ─────────────────────────────────────────────────────────────
    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .item(&undo)
        .item(&redo)
        .item(&separator)
        .item(&cut)
        .item(&copy)
        .item(&paste)
        .item(&select_all)
        .build()?;

    // ── View menu ─────────────────────────────────────────────────────────────
    let toggle_history = MenuItemBuilder::new("Toggle History")
        .accelerator("CmdOrCtrl+Shift+H")
        .id("toggle-history")
        .build(app)?;

    let toggle_sidebar = MenuItemBuilder::new("Toggle Sidebar")
        .accelerator("CmdOrCtrl+B")
        .id("toggle-sidebar")
        .build(app)?;

    let view_sep = PredefinedMenuItem::separator(app)?;
    let reload = PredefinedMenuItem::close_window(app, Some("Reload"))?;

    let devtools = MenuItemBuilder::new("Toggle DevTools")
        .accelerator("CmdOrCtrl+Shift+I")
        .id("devtools")
        .build(app)?;

    let view_menu = SubmenuBuilder::new(app, "View")
        .item(&toggle_history)
        .item(&toggle_sidebar)
        .item(&view_sep)
        .item(&reload)
        .item(&devtools)
        .build()?;

    // ── Help menu ─────────────────────────────────────────────────────────────
    let github = MenuItemBuilder::new("GitHub")
        .id("help-github")
        .build(app)?;

    let report_issue = MenuItemBuilder::new("Report Issue")
        .id("help-report-issue")
        .build(app)?;

    #[cfg(not(target_os = "macos"))]
    let help_sep = PredefinedMenuItem::separator(app)?;

    #[cfg(not(target_os = "macos"))]
    let help_about = MenuItemBuilder::new("About Dev Utils Hub")
        .id("help-about")
        .build(app)?;

    #[cfg(not(target_os = "macos"))]
    let help_menu = SubmenuBuilder::new(app, "Help")
        .item(&github)
        .item(&report_issue)
        .item(&help_sep)
        .item(&help_about)
        .build()?;

    #[cfg(target_os = "macos")]
    let help_menu = SubmenuBuilder::new(app, "Help")
        .item(&github)
        .item(&report_issue)
        .build()?;

    // ── App menu (macOS only) ─────────────────────────────────────────────────
    #[cfg(target_os = "macos")]
    let preferences = MenuItemBuilder::new("Preferences...")
        .accelerator("Cmd+,")
        .id("preferences")
        .build(app)?;

    #[cfg(target_os = "macos")]
    let app_sep1 = PredefinedMenuItem::separator(app)?;
    #[cfg(target_os = "macos")]
    let services = PredefinedMenuItem::services(app, None)?;
    #[cfg(target_os = "macos")]
    let app_sep2 = PredefinedMenuItem::separator(app)?;
    #[cfg(target_os = "macos")]
    let hide = PredefinedMenuItem::hide(app, None)?;
    #[cfg(target_os = "macos")]
    let app_sep3 = PredefinedMenuItem::separator(app)?;
    #[cfg(target_os = "macos")]
    let quit = PredefinedMenuItem::quit(app, None)?;

    #[cfg(target_os = "macos")]
    let app_menu = SubmenuBuilder::new(app, "Dev Utils Hub")
        .about(None)
        .item(&app_sep1)
        .item(&preferences)
        .item(&app_sep2)
        .item(&services)
        .item(&app_sep3)
        .item(&hide)
        .item(&quit)
        .build()?;

    // ── Assemble menu ─────────────────────────────────────────────────────────
    #[cfg(target_os = "macos")]
    let menu = MenuBuilder::new(app)
        .item(&app_menu)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .item(&help_menu)
        .build()?;

    #[cfg(not(target_os = "macos"))]
    let menu = MenuBuilder::new(app)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .item(&help_menu)
        .build()?;

    Ok(menu)
}

pub fn handle_menu_event(app: &AppHandle, event: &tauri::menu::MenuEvent) {
    match event.id().as_ref() {
        "preferences" => {
            app.emit("navigate-to", "/settings").ok();
        }
        "export-history" => {
            app.emit("trigger-export", ()).ok();
        }
        "import-history" => {
            app.emit("trigger-import", ()).ok();
        }
        "toggle-history" => {
            app.emit("toggle-history-panel", ()).ok();
        }
        "toggle-sidebar" => {
            app.emit("shortcut:toggle-history", ()).ok();
        }
        "devtools" => {
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }
        }
        "help-github" => {
            let _ = tauri_plugin_opener::open_url(
                "https://github.com/jellpd/dev-utils-hub",
                None::<&str>,
            );
        }
        "help-report-issue" => {
            let _ = tauri_plugin_opener::open_url(
                "https://github.com/jellpd/dev-utils-hub/issues",
                None::<&str>,
            );
        }
        #[cfg(not(target_os = "macos"))]
        "file-quit" => {
            app.exit(0);
        }
        _ => {}
    }
}
