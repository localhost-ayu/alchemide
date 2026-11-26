use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, State};
use tauri_plugin_updater::{Update, UpdaterExt};

use crate::error::{Error, Result};

#[derive(Default)]
pub struct PendingUpdate(Mutex<Option<Update>>);

#[derive(Debug, PartialEq, Serialize)]
pub struct UpdateInfo {
    pub version: String,
    pub notes: Option<String>,
}

fn update_error(error: impl std::fmt::Display) -> Error {
    Error::Update(error.to_string())
}

pub fn describe(version: &str, notes: Option<&str>) -> UpdateInfo {
    UpdateInfo {
        version: version.to_string(),
        notes: notes
            .map(str::trim)
            .filter(|notes| !notes.is_empty())
            .map(String::from),
    }
}

#[tauri::command]
pub async fn check_update(
    app: AppHandle,
    pending: State<'_, PendingUpdate>,
) -> Result<Option<UpdateInfo>> {
    let update = app
        .updater()
        .map_err(update_error)?
        .check()
        .await
        .map_err(update_error)?;
    let info = update
        .as_ref()
        .map(|update| describe(&update.version, update.body.as_deref()));
    *pending
        .0
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner()) = update;
    Ok(info)
}

#[tauri::command]
pub async fn install_update(app: AppHandle, pending: State<'_, PendingUpdate>) -> Result<()> {
    let update = pending
        .0
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
        .take()
        .ok_or(Error::NoUpdate)?;
    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(update_error)?;
    app.restart()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_release_notes_only_when_they_say_something() {
        assert_eq!(
            describe("0.2.0", Some("  Command palette  ")),
            UpdateInfo {
                version: "0.2.0".into(),
                notes: Some("Command palette".into())
            }
        );
        assert_eq!(describe("0.2.0", Some("   ")).notes, None);
        assert_eq!(describe("0.2.0", None).notes, None);
    }
}
