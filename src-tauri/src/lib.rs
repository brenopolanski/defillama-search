#[cfg(target_os = "macos")]
mod macos_panel;
mod search;
mod window;

use std::sync::Arc;

use tauri::Manager;
use tauri_plugin_global_shortcut::{Builder as ShortcutBuilder, ShortcutState};

use crate::window::{WindowState, MAIN_WINDOW_LABEL, TOGGLE_SHORTCUT};

// Launch-at-login can be added later with tauri-plugin-autostart.
// The MVP has no settings UI, so this is intentionally omitted.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            ShortcutBuilder::default()
                .with_shortcut(TOGGLE_SHORTCUT)
                .expect("invalid global shortcut")
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        window::show_search_window(app);
                    }
                })
                .build(),
        )
        .manage(Arc::new(WindowState::new()))
        .invoke_handler(tauri::generate_handler![
            search::search_directory,
            window::hide_search_window,
            window::show_search_window_cmd,
            window::open_result_url,
        ])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
                if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
                    macos_panel::convert_to_panel(&window);
                }
            }

            window::setup_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            // Only the search popover hides itself on blur; About stays open.
            if window.label() != MAIN_WINDOW_LABEL {
                return;
            }

            if let tauri::WindowEvent::Focused(false) = event {
                if let Some(webview) = window.app_handle().get_webview_window(window.label()) {
                    window::handle_window_blur(&webview);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running DefiLlama Search");
}
