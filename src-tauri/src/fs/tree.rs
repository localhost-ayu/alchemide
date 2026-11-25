use std::cmp::Ordering;
use std::path::Path;

use ignore::WalkBuilder;
use serde::Serialize;

#[derive(Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

pub fn list_dir(dir: &Path) -> Vec<Entry> {
    let walker = WalkBuilder::new(dir)
        .max_depth(Some(1))
        .hidden(false)
        .require_git(false)
        .filter_entry(|entry| entry.file_name() != ".git")
        .build();
    let mut entries: Vec<Entry> = walker
        .filter_map(|result| result.ok())
        .filter(|entry| entry.depth() == 1)
        .map(|entry| Entry {
            name: entry.file_name().to_string_lossy().into_owned(),
            path: entry.path().to_string_lossy().into_owned(),
            is_dir: entry.file_type().is_some_and(|kind| kind.is_dir()),
        })
        .collect();
    entries.sort_by(compare_entries);
    entries
}

fn compare_entries(a: &Entry, b: &Entry) -> Ordering {
    b.is_dir
        .cmp(&a.is_dir)
        .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn names(entries: &[Entry]) -> Vec<&str> {
        entries.iter().map(|entry| entry.name.as_str()).collect()
    }

    fn project() -> TempDir {
        let dir = TempDir::new().expect("temp dir");
        fs::create_dir_all(dir.path().join("src/nested")).expect("src");
        fs::create_dir_all(dir.path().join("dist")).expect("dist");
        fs::create_dir_all(dir.path().join(".git")).expect(".git");
        fs::create_dir_all(dir.path().join(".github")).expect(".github");
        fs::write(dir.path().join(".gitignore"), "dist\n*.log\n").expect(".gitignore");
        fs::write(dir.path().join("README.md"), "").expect("readme");
        fs::write(dir.path().join("app.log"), "").expect("log");
        fs::write(dir.path().join("b.ts"), "").expect("b");
        fs::write(dir.path().join("src/main.ts"), "").expect("main");
        fs::write(dir.path().join("src/debug.log"), "").expect("debug");
        dir
    }

    #[test]
    fn lists_folders_first_then_files_by_name() {
        let dir = project();
        assert_eq!(
            names(&list_dir(dir.path())),
            [".github", "src", ".gitignore", "b.ts", "README.md"]
        );
    }

    #[test]
    fn skips_gitignored_entries_and_the_git_folder() {
        let dir = project();
        let entries = list_dir(dir.path());
        let listed = names(&entries);
        assert!(!listed.contains(&"dist"));
        assert!(!listed.contains(&"app.log"));
        assert!(!listed.contains(&".git"));
    }

    #[test]
    fn applies_the_root_gitignore_inside_subfolders() {
        let dir = project();
        assert_eq!(
            names(&list_dir(&dir.path().join("src"))),
            ["nested", "main.ts"]
        );
    }

    #[test]
    fn marks_folders_and_keeps_full_paths() {
        let dir = project();
        let entries = list_dir(dir.path());
        let src = entries
            .iter()
            .find(|entry| entry.name == "src")
            .expect("src");
        assert!(src.is_dir);
        assert_eq!(Path::new(&src.path), dir.path().join("src"));
    }
}
