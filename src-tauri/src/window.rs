use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use tauri::tray::TrayIconEvent;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder},
    window::Color,
    AppHandle, Emitter, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};
use tauri_plugin_opener::OpenerExt;

pub const TOGGLE_SHORTCUT: &str = "CommandOrControl+Shift+L";
pub const MAIN_WINDOW_LABEL: &str = "main";
const APP_NAME: &str = "DefiLlama Search";
const ABOUT_WINDOW_LABEL: &str = "about";
const ABOUT_WINDOW_WIDTH: f64 = 360.0;
const ABOUT_WINDOW_HEIGHT: f64 = 400.0;
/// Matches `--background` in src/index.css so the window never flashes white.
const ABOUT_WINDOW_BACKGROUND: Color = Color(19, 21, 22, 255);
const WINDOW_SHOWN_EVENT: &str = "search-window-shown";
/// Favorites and recents live in the webview's localStorage, so clearing them
/// has to happen in the frontend.
const FAVORITES_CLEARED_EVENT: &str = "search-favorites-cleared";
const RECENTS_CLEARED_EVENT: &str = "search-recents-cleared";

pub struct WindowState {
    ignore_blur: AtomicBool,
    /// Horizontal center of the tray icon in physical pixels, learned from tray
    /// events. The global shortcut can fire before the user ever touches the
    /// tray, so this stays unknown until then.
    tray_center_x: Mutex<Option<f64>>,
}

impl WindowState {
    pub fn new() -> Self {
        Self {
            ignore_blur: AtomicBool::new(false),
            tray_center_x: Mutex::new(None),
        }
    }

    fn remember_tray_center_x(&self, center_x: f64) {
        if let Ok(mut cached) = self.tray_center_x.lock() {
            *cached = Some(center_x);
        }
    }

    fn tray_center_x(&self) -> Option<f64> {
        self.tray_center_x.lock().ok().and_then(|cached| *cached)
    }
}

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let open_item = MenuItem::with_id(app, "open", "Open Search", true, Some(TOGGLE_SHORTCUT))?;
    let clear_favorites_item = MenuItem::with_id(
        app,
        "clear-favorites",
        "Clear Favorites",
        true,
        None::<&str>,
    )?;
    let clear_recents_item = MenuItem::with_id(
        app,
        "clear-recents",
        "Clear Search History",
        true,
        None::<&str>,
    )?;
    let about_item = MenuItem::with_id(
        app,
        "about",
        format!("About {APP_NAME}"),
        true,
        None::<&str>,
    )?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, Some("cmd+q"))?;
    let top_separator = PredefinedMenuItem::separator(app)?;
    let bottom_separator = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(
        app,
        &[
            &open_item,
            &top_separator,
            &clear_favorites_item,
            &clear_recents_item,
            &bottom_separator,
            &about_item,
            &quit_item,
        ],
    )?;

    let icon = Image::from_bytes(include_bytes!("../icons/tray-icon.png"))?;

    TrayIconBuilder::with_id("main")
        .icon(icon)
        .icon_as_template(true)
        .tooltip(APP_NAME)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_search_window(app),
            "clear-favorites" => emit_to_search_window(app, FAVORITES_CLEARED_EVENT),
            "clear-recents" => emit_to_search_window(app, RECENTS_CLEARED_EVENT),
            "about" => show_about_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            remember_tray_position(tray.app_handle(), &event);

            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                toggle_search_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

pub fn show_search_window(app: &AppHandle) {
    let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
        return;
    };

    let state = app.state::<Arc<WindowState>>();
    state.ignore_blur.store(true, Ordering::SeqCst);

    // On macOS the popover is a non-activating panel, so it is positioned and
    // ordered in natively. Going through `set_focus` would activate the app and
    // drag macOS back to the Space that owns it.
    #[cfg(target_os = "macos")]
    crate::macos_panel::show_panel(&window, state.tray_center_x());

    #[cfg(not(target_os = "macos"))]
    {
        let _ = window.show();
        let _ = window.set_focus();
    }

    let _ = window.emit(WINDOW_SHOWN_EVENT, ());

    let state = Arc::clone(&state);
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(Duration::from_millis(250)).await;
        state.ignore_blur.store(false, Ordering::SeqCst);
    });
}

fn emit_to_search_window(app: &AppHandle, event: &str) {
    let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
        return;
    };

    let _ = window.emit(event, ());
}

/// Unlike the search popover, About is a plain window: it activates the app, is
/// movable, and stays open until the user closes it.
fn show_about_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(ABOUT_WINDOW_LABEL) {
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }

    let builder = WebviewWindowBuilder::new(
        app,
        ABOUT_WINDOW_LABEL,
        WebviewUrl::App(format!("index.html?window={ABOUT_WINDOW_LABEL}").into()),
    )
    .title(format!("About {APP_NAME}"))
    .inner_size(ABOUT_WINDOW_WIDTH, ABOUT_WINDOW_HEIGHT)
    .background_color(ABOUT_WINDOW_BACKGROUND)
    .resizable(false)
    .maximizable(false)
    .minimizable(false)
    .center();

    #[cfg(target_os = "macos")]
    let builder = builder
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .hidden_title(true);

    let Ok(window) = builder.build() else {
        return;
    };

    let _ = window.set_focus();
}

pub fn toggle_search_window(app: &AppHandle) {
    let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
        return;
    };

    match window.is_visible() {
        Ok(true) => hide_window(&window),
        _ => show_search_window(app),
    }
}

pub fn hide_window(window: &WebviewWindow) {
    let _ = window.hide();
}

#[tauri::command]
pub fn hide_search_window(window: WebviewWindow) {
    hide_window(&window);
}

#[tauri::command]
pub fn show_search_window_cmd(app: AppHandle) {
    show_search_window(&app);
}

#[tauri::command]
pub fn open_result_url(app: AppHandle, window: WebviewWindow, url: String) -> Result<(), String> {
    let parsed = reqwest::Url::parse(&url).map_err(|_| "This result has no valid link".to_string())?;
    if parsed.scheme() != "http" && parsed.scheme() != "https" {
        return Err("This result has no valid link".to_string());
    }

    hide_window(&window);
    app.opener()
        .open_url(&url, None::<&str>)
        .map_err(|_| "Unable to open link".to_string())
}

pub fn handle_window_blur(window: &WebviewWindow) {
    let state = window.state::<Arc<WindowState>>();
    if state.ignore_blur.load(Ordering::SeqCst) {
        return;
    }
    hide_window(window);
}

/// Cache where the tray icon sits so the panel can be anchored under it.
fn remember_tray_position(app: &AppHandle, event: &TrayIconEvent) {
    let rect = match event {
        TrayIconEvent::Click { rect, .. }
        | TrayIconEvent::DoubleClick { rect, .. }
        | TrayIconEvent::Enter { rect, .. }
        | TrayIconEvent::Move { rect, .. }
        | TrayIconEvent::Leave { rect, .. } => rect,
        _ => return,
    };

    // tray-icon reports the icon rect in physical pixels on macOS, so these
    // conversions are already no-ops and the scale factor is irrelevant.
    let position = rect.position.to_physical::<f64>(1.0);
    let size = rect.size.to_physical::<f64>(1.0);

    app.state::<Arc<WindowState>>()
        .remember_tray_center_x(position.x + size.width / 2.0);
}
