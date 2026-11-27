use std::path::{Path, PathBuf};

use serde::Serialize;

use crate::config::config_dir;
use crate::error::Result;

const MAX_FILE_SIZE: u64 = 1024 * 1024;

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SnippetFile {
    pub file: String,
    pub content: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SnippetImport {
    pub copied: usize,
    pub found: bool,
}

pub fn is_snippet_file(name: &str) -> bool {
    !name.starts_with('.') && (name.ends_with(".json") || name.ends_with(".code-snippets"))
}

fn snippet_files(dir: &Path) -> Vec<(String, PathBuf)> {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut files: Vec<(String, PathBuf)> = entries
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.file_type().is_ok_and(|kind| kind.is_file()))
        .filter(|entry| {
            entry
                .metadata()
                .is_ok_and(|meta| meta.len() <= MAX_FILE_SIZE)
        })
        .filter_map(|entry| {
            let name = entry.file_name().to_str()?.to_string();
            is_snippet_file(&name).then(|| (name, entry.path()))
        })
        .collect();
    files.sort();
    files
}

pub fn read_snippet_files(dir: &Path) -> Vec<SnippetFile> {
    snippet_files(dir)
        .into_iter()
        .filter_map(|(file, path)| {
            let content = std::fs::read_to_string(path).ok()?;
            Some(SnippetFile { file, content })
        })
        .collect()
}

pub fn copy_snippet_files(from: &Path, to: &Path) -> Result<usize> {
    let sources = snippet_files(from);
    if sources.is_empty() {
        return Ok(0);
    }
    std::fs::create_dir_all(to)?;
    let mut copied = 0;
    for (name, path) in sources {
        let content = std::fs::read(&path)?;
        let candidates = (0..).map(|copy| match copy {
            0 => to.join(&name),
            1 => to.join(format!("vscode-{name}")),
            n => to.join(format!("vscode-{n}-{name}")),
        });
        for target in candidates {
            if std::fs::read(&target).is_ok_and(|existing| existing == content) {
                break;
            }
            if !target.exists() {
                std::fs::write(target, &content)?;
                copied += 1;
                break;
            }
        }
    }
    Ok(copied)
}

pub fn vscode_snippet_dir(system_config: &Path) -> PathBuf {
    system_config.join("Code").join("User").join("snippets")
}

#[tauri::command]
pub async fn list_user_snippets() -> Result<Vec<SnippetFile>> {
    Ok(read_snippet_files(&config_dir()?.join("snippets")))
}

#[tauri::command]
pub async fn import_vscode_snippets() -> Result<SnippetImport> {
    let Some(system_config) = dirs::config_dir() else {
        return Ok(SnippetImport {
            copied: 0,
            found: false,
        });
    };
    let source = vscode_snippet_dir(&system_config);
    if !source.is_dir() {
        return Ok(SnippetImport {
            copied: 0,
            found: false,
        });
    }
    let copied = copy_snippet_files(&source, &config_dir()?.join("snippets"))?;
    Ok(SnippetImport {
        copied,
        found: true,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn accepts_vscode_snippet_files_only() {
        assert!(is_snippet_file("php.json"));
        assert!(is_snippet_file("laravel.code-snippets"));
        assert!(!is_snippet_file("notes.txt"));
        assert!(!is_snippet_file(".php.json.tmp"));
    }

    #[test]
    fn reads_snippet_files_in_name_order() {
        let dir = TempDir::new().expect("temp dir");
        std::fs::write(dir.path().join("rust.json"), "{}").expect("write");
        std::fs::write(dir.path().join("php.json"), "{\"a\":1}").expect("write");
        std::fs::write(dir.path().join("readme.md"), "#").expect("write");

        let files = read_snippet_files(dir.path());

        let names: Vec<&str> = files.iter().map(|file| file.file.as_str()).collect();
        assert_eq!(names, ["php.json", "rust.json"]);
        assert_eq!(files[0].content, "{\"a\":1}");
    }

    #[test]
    fn missing_folder_means_no_snippets() {
        let dir = TempDir::new().expect("temp dir");
        assert!(read_snippet_files(&dir.path().join("nope")).is_empty());
    }

    #[test]
    fn copies_new_files_and_never_overwrites() {
        let dir = TempDir::new().expect("temp dir");
        let from = dir.path().join("vscode");
        let to = dir.path().join("alchemide");
        std::fs::create_dir_all(&from).expect("mkdir");
        std::fs::create_dir_all(&to).expect("mkdir");
        std::fs::write(from.join("php.json"), "{\"from\":\"vscode\"}").expect("write");
        std::fs::write(from.join("go.json"), "{}").expect("write");
        std::fs::write(to.join("php.json"), "{\"mine\":true}").expect("write");
        std::fs::write(to.join("go.json"), "{}").expect("write");

        assert_eq!(copy_snippet_files(&from, &to).expect("copy"), 1);

        let mine = std::fs::read_to_string(to.join("php.json")).expect("read");
        let copied = std::fs::read_to_string(to.join("vscode-php.json")).expect("read");
        assert_eq!(mine, "{\"mine\":true}");
        assert_eq!(copied, "{\"from\":\"vscode\"}");
        assert_eq!(copy_snippet_files(&from, &to).expect("copy again"), 0);
    }

    #[test]
    fn finds_the_vscode_user_snippets_folder() {
        let dir = vscode_snippet_dir(Path::new("/home/me/.config"));
        assert_eq!(dir, Path::new("/home/me/.config/Code/User/snippets"));
    }
}
