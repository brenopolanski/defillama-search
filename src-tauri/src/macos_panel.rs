use std::sync::OnceLock;

use objc2::ffi::object_setClass;
use objc2::runtime::{AnyClass, AnyObject, Bool, ClassBuilder, Sel};
use objc2::{sel, ClassType};
use objc2_app_kit::{
    NSPanel, NSStatusWindowLevel, NSWindow, NSWindowCollectionBehavior, NSWindowStyleMask,
};
use objc2_foundation::NSPoint;
use tauri::WebviewWindow;

/// Breathing room between the menu bar and the top of the panel.
const MENU_BAR_GAP: f64 = 6.0;

struct PanelClass(&'static AnyClass);

// A registered class is immutable and lives for the whole process.
unsafe impl Send for PanelClass {}
unsafe impl Sync for PanelClass {}

extern "C" fn can_become_key_window(_this: &AnyObject, _cmd: Sel) -> Bool {
    Bool::YES
}

extern "C" fn can_become_main_window(_this: &AnyObject, _cmd: Sel) -> Bool {
    Bool::NO
}

/// An NSPanel subclass that accepts key status.
///
/// A borderless window is not eligible to become key on its own, and swapping
/// the class away from tao's `TaoWindow` drops the override tao installed for
/// exactly that. Without key status the webview receives no keystrokes, so
/// Escape does nothing and no blur event ever fires to close the panel.
fn panel_class() -> &'static AnyClass {
    static CLASS: OnceLock<PanelClass> = OnceLock::new();

    CLASS
        .get_or_init(|| {
            let mut builder = ClassBuilder::new(c"DefiLlamaSearchPanel", NSPanel::class())
                .expect("panel class already registered");

            unsafe {
                builder.add_method(
                    sel!(canBecomeKeyWindow),
                    can_become_key_window as extern "C" fn(_, _) -> _,
                );
                builder.add_method(
                    sel!(canBecomeMainWindow),
                    can_become_main_window as extern "C" fn(_, _) -> _,
                );
            }

            PanelClass(builder.register())
        })
        .0
}

/// # Safety
///
/// The caller must be on the main thread, and the returned reference must not
/// outlive the Tauri window that owns the underlying NSWindow.
unsafe fn ns_window(window: &WebviewWindow) -> Option<&NSWindow> {
    let ptr = window.ns_window().ok()?;
    Some(unsafe { &*(ptr as *const NSWindow) })
}

/// Rebuild the popover as a non-activating panel.
///
/// Only a panel honors NonactivatingPanel, and that style is what lets the
/// window take keyboard focus without activating the app. Activating would pull
/// macOS back to whichever Space owns the app, which is the behavior we want to
/// avoid when the user is inside a fullscreen app.
pub fn convert_to_panel(window: &WebviewWindow) {
    unsafe {
        let Some(ns_window) = ns_window(window) else {
            return;
        };

        // objc2's safe `AnyObject::set_class` asserts that both classes have the
        // same instance size. tao's `TaoWindow` declares an extra `focusable`
        // ivar, so it is larger than our panel class and that assert would abort
        // a debug build. Moving to the smaller class is sound because the
        // allocation stays bigger than anything the panel will read.
        let obj = ns_window as *const NSWindow as *mut AnyObject;
        object_setClass(obj, panel_class());

        ns_window.setStyleMask(ns_window.styleMask() | NSWindowStyleMask::NonactivatingPanel);
        // Panels hide themselves when their app deactivates. We drive hiding from
        // the blur handler instead, so the panel can outlive a deactivation.
        ns_window.setHidesOnDeactivate(false);

        apply_panel_behavior(ns_window);
    }
}

/// Make the panel reachable from whatever Space is on screen.
///
/// CanJoinAllSpaces puts it on every Desktop and FullScreenAuxiliary lets it
/// draw over a Space owned by a fullscreen app. The two "space" flags are
/// mutually exclusive: pairing CanJoinAllSpaces with MoveToActiveSpace raises an
/// AppKit exception that aborts the process. Status level keeps the panel above
/// a fullscreen app's own windows.
///
/// # Safety
///
/// The caller must be on the main thread.
unsafe fn apply_panel_behavior(ns_window: &NSWindow) {
    ns_window.setCollectionBehavior(
        NSWindowCollectionBehavior::CanJoinAllSpaces
            .union(NSWindowCollectionBehavior::FullScreenAuxiliary)
            .union(NSWindowCollectionBehavior::Transient)
            .union(NSWindowCollectionBehavior::IgnoresCycle),
    );
    ns_window.setLevel(NSStatusWindowLevel);
}

/// Anchor the panel under the menu bar, centered on the tray icon when known.
///
/// `visibleFrame` already excludes the menu bar and the Dock, so its top edge is
/// the highest point the panel may occupy. Without it the panel would sit at the
/// very top of the display and cover the menu bar, because it now outranks the
/// menu bar's window level.
///
/// # Safety
///
/// The caller must be on the main thread.
unsafe fn position_below_menu_bar(ns_window: &NSWindow, tray_center_x: Option<f64>) {
    let Some(screen) = ns_window.screen() else {
        return;
    };

    let visible = screen.visibleFrame();
    let size = ns_window.frame().size;

    let min_x = visible.origin.x + MENU_BAR_GAP;
    let max_x = (visible.origin.x + visible.size.width - size.width - MENU_BAR_GAP).max(min_x);

    // Menu bar extras live on the right, so that is the best guess before we
    // have ever seen a tray event.
    let x = tray_center_x
        .map(|center| center / ns_window.backingScaleFactor() - size.width / 2.0)
        .unwrap_or(max_x)
        .clamp(min_x, max_x);
    let y = visible.origin.y + visible.size.height - size.height - MENU_BAR_GAP;

    ns_window.setFrameOrigin(NSPoint::new(x, y));
}

/// Show the panel without activating the app.
///
/// `orderFrontRegardless` skips the activation that `WebviewWindow::set_focus`
/// performs, and `makeKeyWindow` routes keystrokes to the webview because the
/// panel is non-activating and accepts key status.
pub fn show_panel(window: &WebviewWindow, tray_center_x: Option<f64>) {
    let panel = window.clone();
    let _ = window.run_on_main_thread(move || unsafe {
        let Some(ns_window) = ns_window(&panel) else {
            return;
        };

        apply_panel_behavior(ns_window);
        position_below_menu_bar(ns_window, tray_center_x);

        ns_window.orderFrontRegardless();
        ns_window.makeKeyWindow();
    });
}
