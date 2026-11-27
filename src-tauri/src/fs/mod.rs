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

    pub fn check(&self, path: &Path) -> Result<()> {
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
    open_root(app_handle, &workspace, root).map(Some)
}

fn open_root(app: AppHandle, workspace: &Workspace, root: PathBuf) -> Result<Folder> {
    let folder = describe_folder(&root);
    let watcher = watcher::create(app.clone())?;
    if let Ok(dir) = crate::config::config_dir() {
        let _ = crate::config::remember_last_folder(&dir, &root);
    }
    workspace.start(Session { root, watcher });
    let _ = app.emit(WORKSPACE_CHANGED_EVENT, &folder);
    Ok(folder)
}

#[tauri::command]
pub async fn reopen_last_folder(
    app: AppHandle,
    workspace: State<'_, Workspace>,
) -> Result<Option<Folder>> {
    let Some(root) = crate::config::last_folder(&crate::config::config_dir()?) else {
        return Ok(None);
    };
    open_root(app, &workspace, root).map(Some)
}

#[tauri::command]
pub async fn recent_folders() -> Result<Vec<Folder>> {
    let dir = crate::config::config_dir()?;
    Ok(crate::config::recent_folders(&dir)
        .iter()
        .map(|folder| describe_folder(folder))
        .collect())
}

#[tauri::command]
pub async fn open_recent_folder(
    path: String,
    app: AppHandle,
    workspace: State<'_, Workspace>,
) -> Result<Folder> {
    let dir = crate::config::config_dir()?;
    let root = crate::config::recent_folders(&dir)
        .into_iter()
        .find(|folder| folder.to_string_lossy() == path)
        .ok_or(Error::OutsideWorkspace)?;
    open_root(app, &workspace, root)
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

const FORBIDDEN_IN_NAMES: [char; 7] = ['<', '>', ':', '"', '|', '?', '*'];

pub fn child_path(parent: &Path, name: &str) -> Option<PathBuf> {
    let parts: Vec<&str> = name.trim().split(['/', '\\']).collect();
    let valid = parts.iter().all(|part| {
        !part.is_empty()
            && *part != "."
            && *part != ".."
            && !part.ends_with(' ')
            && !part.ends_with('.')
            && !part
                .chars()
                .any(|c| c.is_control() || FORBIDDEN_IN_NAMES.contains(&c))
    });
    valid.then(|| {
        parts
            .iter()
            .fold(parent.to_path_buf(), |path, part| path.join(part))
    })
}

pub fn create(parent: &Path, name: &str, is_dir: bool) -> Result<PathBuf> {
    if !parent.is_dir() {
        return Err(Error::InvalidName);
    }
    let target = child_path(parent, name).ok_or(Error::InvalidName)?;
    if target.exists() {
        return Err(Error::AlreadyExists);
    }
    if is_dir {
        std::fs::create_dir_all(&target)?;
        return Ok(target);
    }
    if let Some(folder) = target.parent() {
        std::fs::create_dir_all(folder)?;
    }
    std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&target)
        .map_err(|error| match error.kind() {
            std::io::ErrorKind::AlreadyExists => Error::AlreadyExists,
            _ => Error::Io(error),
        })?;
    Ok(target)
}

pub fn rename(path: &Path, new_name: &str) -> Result<PathBuf> {
    let parent = path.parent().ok_or(Error::InvalidName)?;
    if new_name.contains(['/', '\\']) {
        return Err(Error::InvalidName);
    }
    let target = child_path(parent, new_name).ok_or(Error::InvalidName)?;
    if target == path {
        return Ok(target);
    }
    let same_entry = target.exists() && target.canonicalize().ok() == path.canonicalize().ok();
    if target.exists() && !same_entry {
        return Err(Error::AlreadyExists);
    }
    std::fs::rename(path, &target)?;
    Ok(target)
}

fn ensure_not_root(workspace: &Workspace, path: &Path) -> Result<()> {
    let root = workspace.root().ok_or(Error::NoWorkspace)?;
    if root.canonicalize()? == path.canonicalize()? {
        return Err(Error::WorkspaceRoot);
    }
    Ok(())
}

#[tauri::command]
pub async fn rename_entry(
    path: String,
    new_name: String,
    workspace: State<'_, Workspace>,
) -> Result<String> {
    let path = Path::new(&path);
    workspace.check(path)?;
    ensure_not_root(&workspace, path)?;
    let renamed = rename(path, &new_name)?;
    Ok(renamed.to_string_lossy().into_owned())
}

#[tauri::command]
pub async fn delete_entry(path: String, workspace: State<'_, Workspace>) -> Result<()> {
    let path = PathBuf::from(path);
    workspace.check(&path)?;
    ensure_not_root(&workspace, &path)?;
    tauri::async_runtime::spawn_blocking(move || trash::delete(&path))
        .await
        .map_err(|error| Error::Trash(error.to_string()))?
        .map_err(|error| Error::Trash(error.to_string()))
}

#[tauri::command]
pub async fn create_entry(
    parent: String,
    name: String,
    is_dir: bool,
    workspace: State<'_, Workspace>,
) -> Result<String> {
    let parent = Path::new(&parent);
    workspace.check(parent)?;
    let created = create(parent, &name, is_dir)?;
    Ok(created.to_string_lossy().into_owned())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn builds_child_paths_only_from_plain_names() {
        let parent = Path::new("/project/src");
        assert_eq!(
            child_path(parent, " utils/date.ts "),
            Some(PathBuf::from("/project/src/utils/date.ts"))
        );
        assert_eq!(
            child_path(parent, "a\\b.php"),
            Some(PathBuf::from("/project/src/a/b.php"))
        );
        for bad in [
            "",
            "  ",
            "..",
            "../x",
            "a/../b",
            "/etc/passwd",
            "a//b",
            "con:x",
            "what?",
            "dot.",
            "a\u{7}",
        ] {
            assert_eq!(child_path(parent, bad), None, "{bad:?} should be rejected");
        }
    }

    #[test]
    fn renames_in_place_without_overwriting_or_moving() {
        let root = TempDir::new().expect("temp dir");
        let file = create(root.path(), "a.txt", false).expect("file");
        create(root.path(), "b.txt", false).expect("other");

        let renamed = rename(&file, "c.txt").expect("rename");
        assert_eq!(renamed, root.path().join("c.txt"));
        assert!(renamed.is_file() && !file.exists());

        assert!(matches!(
            rename(&renamed, "b.txt"),
            Err(Error::AlreadyExists)
        ));
        assert!(matches!(
            rename(&renamed, "sub/d.txt"),
            Err(Error::InvalidName)
        ));
        assert!(matches!(rename(&renamed, ".."), Err(Error::InvalidName)));
        assert_eq!(rename(&renamed, "c.txt").expect("same name"), renamed);

        let folder = create(root.path(), "src/deep", true).expect("folder");
        let moved = rename(folder.parent().expect("src"), "lib").expect("dir");
        assert!(moved.join("deep").is_dir());
    }

    #[test]
    fn creates_files_and_folders_without_overwriting() {
        let root = TempDir::new().expect("temp dir");
        let file = create(root.path(), "src/utils/date.ts", false).expect("file");
        assert!(file.is_file());
        assert_eq!(std::fs::read_to_string(&file).expect("read"), "");

        std::fs::write(&file, "keep").expect("write");
        assert!(matches!(
            create(root.path(), "src/utils/date.ts", false),
            Err(Error::AlreadyExists)
        ));
        assert_eq!(std::fs::read_to_string(&file).expect("read"), "keep");

        let folder = create(root.path(), "docs/notes", true).expect("folder");
        assert!(folder.is_dir());
        assert!(matches!(
            create(root.path(), "docs", true),
            Err(Error::AlreadyExists)
        ));
        assert!(matches!(
            create(&file, "inside", false),
            Err(Error::InvalidName)
        ));
    }

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
