use std::path::{Path, PathBuf};
use std::sync::Mutex;

use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

use crate::error::{Error, Result};

mod file;
mod tree;
mod watcher;

struct Session {
    root: PathBuf,
    watcher: RecommendedWatcher,
}

#[derive(Default)]
pub struct Workspace {
    session: Mutex<Option<Session>>,
}

impl Workspace {
    fn start(&self, session: Session) {
        *self.lock() = Some(session);
    }

    fn list_and_watch(&self, dir: &Path) -> Result<Vec<tree::Entry>> {
        let mut guard = self.lock();
        let session = guard.as_mut().ok_or(Error::NoWorkspace)?;
        ensure_inside(&session.root, dir)?;
        if let Err(error) = session.watcher.watch(dir, RecursiveMode::NonRecursive) {
            eprintln!("could not watch {}: {error}", dir.display());
        }
        Ok(tree::list_dir(dir))
    }

    fn check(&self, path: &Path) -> Result<()> {
        let guard = self.lock();
        let session = guard.as_ref().ok_or(Error::NoWorkspace)?;
        ensure_inside(&session.root, path)
    }

    pub fn root(&self) -> Option<PathBuf> {
        self.lock().as_ref().map(|session| session.root.clone())
    }

    fn lock(&self) -> std::sync::MutexGuard<'_, Option<Session>> {
        self.session
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
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
    let app_handle = app.clone();
    let picked =
        tauri::async_runtime::spawn_blocking(move || app.dialog().file().blocking_pick_folder())
            .await
            .map_err(|_| Error::Dialog)?;
    let Some(picked) = picked else {
        return Ok(None);
    };
    let root = picked.into_path().map_err(|_| Error::NotLocalFolder)?;
    let folder = describe_folder(&root);
    let watcher = watcher::create(app_handle)?;
    workspace.start(Session { root, watcher });
    Ok(Some(folder))
}

#[tauri::command]
pub async fn list_dir(path: String, workspace: State<'_, Workspace>) -> Result<Vec<tree::Entry>> {
    workspace.list_and_watch(Path::new(&path))
}

#[tauri::command]
pub async fn read_file(path: String, workspace: State<'_, Workspace>) -> Result<file::FileContent> {
    let path = Path::new(&path);
    workspace.check(path)?;
    file::decode(std::fs::read(path)?)
}

#[tauri::command]
pub async fn write_file(
    path: String,
    text: String,
    has_bom: bool,
    workspace: State<'_, Workspace>,
) -> Result<()> {
    let path = Path::new(&path);
    workspace.check(path)?;
    std::fs::write(path, file::encode(&text, has_bom))?;
    Ok(())
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
