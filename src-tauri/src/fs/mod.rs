use std::path::{Path, PathBuf};
use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

use crate::error::{Error, Result};

#[derive(Default)]
pub struct Workspace {
    root: Mutex<Option<PathBuf>>,
}

#[derive(Debug, PartialEq, Serialize)]
pub struct Folder {
    pub name: String,
    pub path: String,
}

pub fn describe_folder(path: &Path) -> Folder {
    let full = path.to_string_lossy().into_owned();
    let name = path
        .file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_else(|| full.clone());
    Folder { name, path: full }
}

#[tauri::command]
pub async fn open_folder(
    app: AppHandle,
    workspace: State<'_, Workspace>,
) -> Result<Option<Folder>> {
    let picked =
        tauri::async_runtime::spawn_blocking(move || app.dialog().file().blocking_pick_folder())
            .await
            .map_err(|_| Error::Dialog)?;
    let Some(picked) = picked else {
        return Ok(None);
    };
    let root = picked.into_path().map_err(|_| Error::NotLocalFolder)?;
    let folder = describe_folder(&root);
    *workspace
        .root
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner()) = Some(root);
    Ok(Some(folder))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn names_a_folder_after_its_last_component() {
        let folder = describe_folder(Path::new("/home/user/alchemide"));
        assert_eq!(folder.name, "alchemide");
        assert_eq!(folder.path, "/home/user/alchemide");
    }

    #[test]
    fn names_a_filesystem_root_after_its_full_path() {
        assert_eq!(describe_folder(Path::new("/")).name, "/");
    }
}
