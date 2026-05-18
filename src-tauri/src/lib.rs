use tauri::{
    menu::{AboutMetadata, Menu, MenuItem, PredefinedMenuItem, Submenu},
    AppHandle, Emitter, Runtime,
};

fn build_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    // On macOS the first menu slot is always the application menu.
    // We must occupy it explicitly so "File" renders as a separate menu.
    let app_menu = Submenu::with_items(
        app,
        "App",
        true,
        &[
            &PredefinedMenuItem::about(
                app,
                None,
                Some(AboutMetadata {
                    version: Some(env!("CARGO_PKG_VERSION").to_string()),
                    comments: Some(format!("Built {}", env!("BUILD_TIME"))),
                    ..Default::default()
                }),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, None)?,
        ],
    )?;

    let file_submenu = Submenu::with_items(
        app,
        "File",
        true,
        &[
            &MenuItem::with_id(app, "menu:new",               "New",                  true, Some("CmdOrCtrl+N"))?,
            &MenuItem::with_id(app, "menu:open",              "Open...",              true, Some("CmdOrCtrl+O"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "menu:save",              "Save",                 true, Some("CmdOrCtrl+S"))?,
            &MenuItem::with_id(app, "menu:save-as",           "Save As...",           true, Some("CmdOrCtrl+Shift+S"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "menu:edit-palettes",     "Edit Palettes...",     true, None::<&str>)?,
            &MenuItem::with_id(app, "menu:edit-themes",       "Edit Themes...",       true, None::<&str>)?,
            &MenuItem::with_id(app, "menu:settings",          "Settings...",          true, Some("CmdOrCtrl+,"))?,
            &MenuItem::with_id(app, "menu:document-settings", "Document Settings...", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "menu:export-png",        "Export PNG...",        true, None::<&str>)?,
            &MenuItem::with_id(app, "menu:export-pdf",        "Export PDF...",        true, None::<&str>)?,
            &MenuItem::with_id(app, "menu:export-html",       "Export HTML...",       true, None::<&str>)?,
        ],
    )?;

    let edit_submenu = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &PredefinedMenuItem::undo(app, None)?,
            &PredefinedMenuItem::redo(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::cut(app, None)?,
            &PredefinedMenuItem::copy(app, None)?,
            &PredefinedMenuItem::paste(app, None)?,
            &PredefinedMenuItem::select_all(app, None)?,
        ],
    )?;

    let window_submenu = Submenu::with_items(
        app,
        "Window",
        true,
        &[
            &PredefinedMenuItem::minimize(app, None)?,
            &PredefinedMenuItem::maximize(app, None)?,
            &PredefinedMenuItem::close_window(app, None)?,
        ],
    )?;

    Menu::with_items(app, &[&app_menu, &file_submenu, &edit_submenu, &window_submenu])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let menu = build_menu(app.handle())?;
            app.set_menu(menu)?;
            let handle = app.handle().clone();
            app.on_menu_event(move |_app, event| {
                let id = event.id().0.as_str();
                if id.starts_with("menu:") {
                    if let Err(e) = handle.emit(id, ()) {
                        eprintln!("menu emit error {id}: {e}");
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
