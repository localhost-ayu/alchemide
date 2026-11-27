use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{Arc, Mutex};

use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_dialog::DialogExt;

use crate::error::{Error, Result};

pub const WORKSPACE_CHANGED_EVENT: &str = "workspace-changed";

mod file;
mod search;
mod tree;
mod watcher;

struct Session {
    root: PathBuf,
    watcher: RecommendedWatcher,
}

#[derive(Default)]
pub struct Workspace {
    session: Mutex<Option<Session>>,
    loose_files: Mutex<HashSet<PathBuf>>,
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
        let root = self.root();
        let loose = self.loose();
        is_allowed(root.as_deref(), &loose, path)
    }

    fn allow_file(&self, path: PathBuf) {
        self.loose().insert(path);
    }

    fn loose(&self) -> std::sync::MutexGuard<'_, HashSet<PathBuf>> {
        self.loose_files
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
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

pub fn is_allowed(root: Option<&Path>, loose_files: &HashSet<PathBuf>, path: &Path) -> Result<()> {
    if loose_files.contains(&path.canonicalize()?) {
        return Ok(());
    }
    ensure_inside(root.ok_or(Error::NoWorkspace)?, path)
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
    let watcher = watcher::create(app_handle.clone())?;
    workspace.start(Session { root, watcher });
    let _ = app_handle.emit(WORKSPACE_CHANGED_EVENT, &folder);
    Ok(Some(folder))
}

#[tauri::command]
pub async fn pick_file(app: AppHandle, workspace: State<'_, Workspace>) -> Result<Option<String>> {
    let picked =
        tauri::async_runtime::spawn_blocking(move || app.dialog().file().blocking_pick_file())
            .await
            .map_err(|_| Error::Dialog)?;
    let Some(picked) = picked else {
        return Ok(None);
    };
    let path = picked.into_path().map_err(|_| Error::NotLocalFolder)?;
    workspace.allow_file(path.canonicalize()?);
    Ok(Some(path.to_string_lossy().into_owned()))
}

#[tauri::command]
pub async fn list_dir(path: String, workspace: State<'_, Workspace>) -> Result<Vec<tree::Entry>> {
    workspace.list_and_watch(Path::new(&path))
}

pub const SEARCH_RESULTS_EVENT: &str = "search-results";
pub const SEARCH_DONE_EVENT: &str = "search-done";
const SEARCH_LIMIT: usize = 5_000;
const SEARCH_BATCH: usize = 50;

#[derive(Default)]
pub struct Searches {
    current: Arc<AtomicU32>,
}

#[derive(Clone, Serialize)]
struct SearchBatch {
    id: u32,
    matches: Vec<search::SearchMatch>,
}

#[derive(Clone, Serialize)]
struct SearchDone {
    id: u32,
    total: usize,
    truncated: bool,
}

#[tauri::command]
pub async fn search_start(
    app: AppHandle,
    id: u32,
    query: search::SearchQuery,
    workspace: State<'_, Workspace>,
    searches: State<'_, Searches>,
) -> Result<()> {
    let root = workspace.root().ok_or(Error::NoWorkspace)?;
    let matcher = search::build_matcher(&query)?;
    let current = searches.current.clone();
    current.store(id, Ordering::SeqCst);
    std::thread::spawn(move || {
        let mut batch = Vec::new();
        let mut sent = 0;
        search::search_files(&root, &matcher, |found| {
            if current.load(Ordering::SeqCst) != id {
                return false;
            }
            batch.push(found);
            sent += 1;
            if batch.len() == SEARCH_BATCH {
                let matches = std::mem::take(&mut batch);
                let _ = app.emit(SEARCH_RESULTS_EVENT, SearchBatch { id, matches });
            }
            sent < SEARCH_LIMIT
        });
        if current.load(Ordering::SeqCst) != id {
            return;
        }
        if !batch.is_empty() {
            let _ = app.emit(SEARCH_RESULTS_EVENT, SearchBatch { id, matches: batch });
        }
        let done = SearchDone {
            id,
            total: sent,
            truncated: sent >= SEARCH_LIMIT,
        };
        let _ = app.emit(SEARCH_DONE_EVENT, done);
    });
    Ok(())
}

#[derive(Deserialize)]
pub struct ReplaceTarget {
    path: String,
    lines: Vec<u64>,
}

#[derive(Serialize)]
pub struct ReplaceSummary {
    files: usize,
    replacements: usize,
}

#[tauri::command]
pub async fn replace_matches(
    query: search::SearchQuery,
    replacement: String,
    targets: Vec<ReplaceTarget>,
    workspace: State<'_, Workspace>,
) -> Result<ReplaceSummary> {
    let regex = search::build_regex(&query)?;
    let mut summary = ReplaceSummary {
        files: 0,
        replacements: 0,
    };
    for target in targets {
        let path = Path::new(&target.path);
        workspace.check(path)?;
        let content = file::decode(std::fs::read(path)?)?;
        let lines = target.lines.into_iter().collect();
        let (text, count) =
            search::replace_lines(&content.text, &regex, &replacement, query.regex, &lines);
        if count > 0 {
            std::fs::write(path, file::encode(&text, content.has_bom))?;
            summary.files += 1;
            summary.replacements += count;
        }
    }
    Ok(summary)
}

#[tauri::command]
pub async fn list_files(workspace: State<'_, Workspace>) -> Result<Vec<tree::ProjectFile>> {
    let root = workspace.root().ok_or(Error::NoWorkspace)?;
    Ok(tree::project_files(&root, tree::PROJECT_FILE_LIMIT))
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
    fn allows_files_picked_outside_the_open_folder() {
        let dir = TempDir::new().expect("temp dir");
        let root = dir.path().join("project");
        std::fs::create_dir(&root).expect("project");
        let notes = dir.path().join("notes.md");
        let other = dir.path().join("other.md");
        std::fs::write(&notes, "").expect("notes");
        std::fs::write(&other, "").expect("other");
        let loose = HashSet::from([notes.canonicalize().expect("canonical")]);

        assert!(is_allowed(Some(&root), &loose, &notes).is_ok());
        assert!(is_allowed(None, &loose, &notes).is_ok());
        assert!(matches!(
            is_allowed(Some(&root), &loose, &other),
            Err(Error::OutsideWorkspace)
        ));
        assert!(matches!(
            is_allowed(None, &loose, &other),
            Err(Error::NoWorkspace)
        ));
    }

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
