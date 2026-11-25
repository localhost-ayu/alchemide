use std::path::{Path, PathBuf};
use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

use crate::error::{Error, Result};

mod tree;

#[derive(Default)]
pub struct Workspace {
    root: Mutex<Option<PathBuf>>,
}

impl Workspace {
    fn resolve(&self, path: &Path) -> Result<PathBuf> {
        let root = self
            .root
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .clone()
            .ok_or(Error::NoWorkspace)?;
        ensure_inside(&root, path)?;
        Ok(path.to_path_buf())
    }
}

pub fn ensure_inside(root: &Path, path: &Path) -> Result<()> {
    let root = root.canonicalize()?;
    let path = path.canonicalize()?;
    if path.starts_with(&root) {
        Ok(())
    } else {
        Err(Error::OutsideWorkspace)
    }
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

#[tauri::command]
pub async fn list_dir(path: String, workspace: State<'_, Workspace>) -> Result<Vec<tree::Entry>> {
    let dir = workspace.resolve(Path::new(&path))?;
    Ok(tree::list_dir(&dir))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn accepts_paths_inside_the_root() {
        let root = TempDir::new().expect("temp dir");
        std::fs::create_dir(root.path().join("src")).expect("src");
        assert!(ensure_inside(root.path(), &root.path().join("src")).is_ok());
        assert!(ensure_inside(root.path(), root.path()).is_ok());
    }

    #[test]
    fn rejects_paths_that_escape_the_root() {
        let parent = TempDir::new().expect("temp dir");
        let root = parent.path().join("project");
        std::fs::create_dir(&root).expect("project");
        std::fs::create_dir(parent.path().join("secrets")).expect("secrets");
        let escaped = root.join("..").join("secrets");
        assert!(matches!(
            ensure_inside(&root, &escaped),
            Err(Error::OutsideWorkspace)
        ));
    }

    #[test]
    fn rejects_paths_that_do_not_exist() {
        let root = TempDir::new().expect("temp dir");
        assert!(matches!(
            ensure_inside(root.path(), &root.path().join("missing")),
            Err(Error::Io(_))
        ));
    }

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
