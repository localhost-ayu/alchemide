use std::collections::BTreeSet;
use std::path::{Component, Path, PathBuf};

use notify::{Event, EventKind, RecommendedWatcher};
use tauri::{AppHandle, Emitter};

use crate::error::Result;

pub const CHANGED_EVENT: &str = "fs-changed";

pub fn create(app: AppHandle) -> Result<RecommendedWatcher> {
    let watcher = notify::recommended_watcher(move |result: notify::Result<Event>| {
        let Ok(event) = result else {
            return;
        };
        if matches!(event.kind, EventKind::Access(_)) {
            return;
        }
        let dirs = changed_dirs(&event.paths);
        if !dirs.is_empty() {
            let _ = app.emit(CHANGED_EVENT, dirs);
        }
    })?;
    Ok(watcher)
}

pub fn changed_dirs(paths: &[PathBuf]) -> Vec<String> {
    paths
        .iter()
        .filter(|path| !is_inside_git_folder(path))
        .filter_map(|path| path.parent())
        .map(|dir| dir.to_string_lossy().into_owned())
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect()
}

fn is_inside_git_folder(path: &Path) -> bool {
    path.components()
        .any(|component| component == Component::Normal(".git".as_ref()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reports_the_parent_folder_of_each_change_once() {
        let paths = [
            PathBuf::from("/project/src/a.ts"),
            PathBuf::from("/project/src/b.ts"),
            PathBuf::from("/project/README.md"),
        ];
        assert_eq!(changed_dirs(&paths), ["/project", "/project/src"]);
    }

    #[test]
    fn ignores_changes_inside_the_git_folder() {
        let paths = [PathBuf::from("/project/.git/index")];
        assert!(changed_dirs(&paths).is_empty());
    }

    #[test]
    fn keeps_files_that_only_start_with_git() {
        let paths = [PathBuf::from("/project/.github/ci.yml")];
        assert_eq!(changed_dirs(&paths), ["/project/.github"]);
    }
}
