use std::io::ErrorKind;
use std::path::{Component, Path, PathBuf};
use std::process::{Command, Output};

use serde::Serialize;
use tauri::State;

use crate::error::{Error, Result};
use crate::fs::Workspace;

const LOG_FORMAT: &str = "%H%x1f%h%x1f%an%x1f%aI%x1f%s%x1e";
const LOG_LIMIT: usize = 200;

#[derive(Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangedFile {
    pub path: String,
    pub original_path: Option<String>,
    pub staged: Option<char>,
    pub unstaged: Option<char>,
}

#[derive(Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatus {
    pub branch: Option<String>,
    pub files: Vec<ChangedFile>,
}

#[derive(Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Commit {
    pub hash: String,
    pub short_hash: String,
    pub author: String,
    pub date: String,
    pub subject: String,
}

fn status_code(code: char) -> Option<char> {
    (code != ' ' && code != '?').then_some(code)
}

pub fn parse_status(output: &str) -> GitStatus {
    let mut entries = output.split('\0').filter(|entry| !entry.is_empty());
    let mut branch = None;
    let mut files = Vec::new();
    while let Some(entry) = entries.next() {
        if let Some(header) = entry.strip_prefix("## ") {
            let name = header.split("...").next().unwrap_or(header);
            let name = name.strip_prefix("No commits yet on ").unwrap_or(name);
            branch = (!name.starts_with("HEAD (no branch)")).then(|| name.to_string());
            continue;
        }
        let mut chars = entry.chars();
        let (Some(x), Some(y)) = (chars.next(), chars.next()) else {
            continue;
        };
        let path = entry.get(3..).unwrap_or_default().to_string();
        let original_path = if x == 'R' || x == 'C' {
            entries.next().map(String::from)
        } else {
            None
        };
        let untracked = x == '?' && y == '?';
        files.push(ChangedFile {
            path,
            original_path,
            staged: status_code(x),
            unstaged: if untracked { Some('?') } else { status_code(y) },
        });
    }
    GitStatus { branch, files }
}

pub fn parse_log(output: &str) -> Vec<Commit> {
    output
        .split('\u{1e}')
        .map(|record| record.trim_matches(['\n', '\r']))
        .filter(|record| !record.is_empty())
        .filter_map(|record| {
            let mut fields = record.split('\u{1f}');
            Some(Commit {
                hash: fields.next()?.to_string(),
                short_hash: fields.next()?.to_string(),
                author: fields.next()?.to_string(),
                date: fields.next()?.to_string(),
                subject: fields.next().unwrap_or_default().to_string(),
            })
        })
        .collect()
}

pub fn is_safe_repo_path(path: &str) -> bool {
    let path = Path::new(path);
    !path.as_os_str().is_empty()
        && path
            .components()
            .all(|component| matches!(component, Component::Normal(_)))
}

pub fn is_commit_hash(hash: &str) -> bool {
    (4..=64).contains(&hash.len()) && hash.chars().all(|c| c.is_ascii_hexdigit())
}

fn first_line(text: &[u8]) -> String {
    String::from_utf8_lossy(text)
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .unwrap_or("git did not answer")
        .to_string()
}

fn run(dir: &Path, args: &[&str], ok_codes: &[i32]) -> Result<Output> {
    let mut command = Command::new("git");
    command
        .current_dir(dir)
        .args(args)
        .env("GIT_TERMINAL_PROMPT", "0");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    let output = command.output().map_err(|error| match error.kind() {
        ErrorKind::NotFound => Error::GitMissing,
        _ => Error::Git(error.to_string()),
    })?;
    let code = output.status.code().unwrap_or(-1);
    if output.status.success() || ok_codes.contains(&code) {
        Ok(output)
    } else {
        Err(Error::Git(first_line(&output.stderr)))
    }
}

fn text(output: Output) -> String {
    String::from_utf8_lossy(&output.stdout).into_owned()
}

fn repository_root(workspace: &Workspace) -> Result<PathBuf> {
    let root = workspace.root().ok_or(Error::NoWorkspace)?;
    let output =
        run(&root, &["rev-parse", "--show-toplevel"], &[]).map_err(|_| Error::NotARepository)?;
    Ok(PathBuf::from(text(output).trim()))
}

fn checked_paths(paths: &[String]) -> Result<Vec<&str>> {
    paths
        .iter()
        .map(|path| {
            is_safe_repo_path(path)
                .then_some(path.as_str())
                .ok_or(Error::OutsideWorkspace)
        })
        .collect()
}

async fn blocking<T: Send + 'static>(
    work: impl FnOnce() -> Result<T> + Send + 'static,
) -> Result<T> {
    tauri::async_runtime::spawn_blocking(work)
        .await
        .map_err(|error| Error::Git(error.to_string()))?
}

#[tauri::command]
pub async fn git_status(workspace: State<'_, Workspace>) -> Result<GitStatus> {
    let dir = repository_root(&workspace)?;
    blocking(move || {
        let output = run(
            &dir,
            &[
                "status",
                "--porcelain=v1",
                "-z",
                "--branch",
                "--untracked-files=all",
            ],
            &[],
        )?;
        Ok(parse_status(&text(output)))
    })
    .await
}

#[tauri::command]
pub async fn git_diff(
    path: String,
    staged: bool,
    untracked: bool,
    workspace: State<'_, Workspace>,
) -> Result<String> {
    let dir = repository_root(&workspace)?;
    checked_paths(std::slice::from_ref(&path))?;
    blocking(move || {
        let output = if untracked {
            run(
                &dir,
                &["diff", "--no-color", "--no-index", "--", "/dev/null", &path],
                &[1],
            )?
        } else if staged {
            run(&dir, &["diff", "--no-color", "--cached", "--", &path], &[])?
        } else {
            run(&dir, &["diff", "--no-color", "--", &path], &[])?
        };
        Ok(text(output))
    })
    .await
}

#[tauri::command]
pub async fn git_stage(paths: Vec<String>, workspace: State<'_, Workspace>) -> Result<()> {
    let dir = repository_root(&workspace)?;
    checked_paths(&paths)?;
    blocking(move || {
        let mut args = vec!["add", "--"];
        args.extend(paths.iter().map(String::as_str));
        run(&dir, &args, &[]).map(|_| ())
    })
    .await
}

#[tauri::command]
pub async fn git_stage_all(workspace: State<'_, Workspace>) -> Result<()> {
    let dir = repository_root(&workspace)?;
    blocking(move || run(&dir, &["add", "--all"], &[]).map(|_| ())).await
}

#[tauri::command]
pub async fn git_unstage(paths: Vec<String>, workspace: State<'_, Workspace>) -> Result<()> {
    let dir = repository_root(&workspace)?;
    checked_paths(&paths)?;
    blocking(move || {
        let has_commits = run(&dir, &["rev-parse", "--verify", "--quiet", "HEAD"], &[]).is_ok();
        let mut args = if has_commits {
            vec!["restore", "--staged", "--"]
        } else {
            vec!["rm", "--cached", "--quiet", "--"]
        };
        args.extend(paths.iter().map(String::as_str));
        run(&dir, &args, &[]).map(|_| ())
    })
    .await
}

#[tauri::command]
pub async fn git_commit(message: String, workspace: State<'_, Workspace>) -> Result<String> {
    if message.trim().is_empty() {
        return Err(Error::Git("write a commit message".into()));
    }
    let dir = repository_root(&workspace)?;
    blocking(move || {
        run(&dir, &["commit", "--quiet", "--message", &message], &[])?;
        let output = run(&dir, &["rev-parse", "--short", "HEAD"], &[])?;
        Ok(text(output).trim().to_string())
    })
    .await
}

#[tauri::command]
pub async fn git_log(workspace: State<'_, Workspace>) -> Result<Vec<Commit>> {
    let dir = repository_root(&workspace)?;
    blocking(move || {
        let limit = format!("--max-count={LOG_LIMIT}");
        let format = format!("--pretty=format:{LOG_FORMAT}");
        match run(&dir, &["log", &limit, &format], &[]) {
            Ok(output) => Ok(parse_log(&text(output))),
            Err(_) => Ok(Vec::new()),
        }
    })
    .await
}

#[tauri::command]
pub async fn git_show(hash: String, workspace: State<'_, Workspace>) -> Result<String> {
    if !is_commit_hash(&hash) {
        return Err(Error::Git("not a commit hash".into()));
    }
    let dir = repository_root(&workspace)?;
    blocking(move || {
        let output = run(&dir, &["show", "--no-color", "--format=%B", &hash], &[])?;
        Ok(text(output))
    })
    .await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_the_branch_and_each_kind_of_change() {
        let output = "## main...origin/main [ahead 1]\0M  staged.ts\0 M edited.ts\0MM both.ts\0?? new file.md\0R  new.ts\0old.ts\0D  gone.ts\0";
        let status = parse_status(output);
        assert_eq!(status.branch.as_deref(), Some("main"));
        let summary: Vec<_> = status
            .files
            .iter()
            .map(|file| (file.path.as_str(), file.staged, file.unstaged))
            .collect();
        assert_eq!(
            summary,
            [
                ("staged.ts", Some('M'), None),
                ("edited.ts", None, Some('M')),
                ("both.ts", Some('M'), Some('M')),
                ("new file.md", None, Some('?')),
                ("new.ts", Some('R'), None),
                ("gone.ts", Some('D'), None),
            ]
        );
        assert_eq!(status.files[4].original_path.as_deref(), Some("old.ts"));
    }

    #[test]
    fn handles_new_repositories_and_detached_heads() {
        assert_eq!(
            parse_status("## No commits yet on main\0")
                .branch
                .as_deref(),
            Some("main")
        );
        assert_eq!(parse_status("## HEAD (no branch)\0").branch, None);
        assert!(parse_status("").files.is_empty());
    }

    #[test]
    fn reads_the_log() {
        let output = "abc123\u{1f}abc\u{1f}Ana\u{1f}2026-11-27T10:00:00-03:00\u{1f}feat: first\u{1e}\ndef456\u{1f}def\u{1f}Bia\u{1f}2026-11-26T09:00:00-03:00\u{1f}fix: with \u{1f}weird\u{1e}";
        let log = parse_log(output);
        assert_eq!(log.len(), 2);
        assert_eq!(log[0].short_hash, "abc");
        assert_eq!(log[0].subject, "feat: first");
        assert_eq!(log[1].author, "Bia");
        assert!(parse_log("").is_empty());
    }

    #[test]
    fn accepts_only_plain_relative_paths() {
        assert!(is_safe_repo_path("src/app.ts"));
        assert!(is_safe_repo_path("new file.md"));
        for bad in ["", "../secret", "/etc/passwd", "src/../../x", "./src"] {
            assert!(!is_safe_repo_path(bad), "{bad} should be rejected");
        }
    }

    #[test]
    fn accepts_only_hex_commit_hashes() {
        assert!(is_commit_hash("abc123"));
        assert!(!is_commit_hash("--output=/tmp/x"));
        assert!(!is_commit_hash("abc"));
        assert!(!is_commit_hash("HEAD"));
    }

    fn git(dir: &Path, args: &[&str]) {
        run(dir, args, &[]).expect("git");
    }

    #[test]
    fn stages_unstages_and_commits_in_a_real_repository() {
        let dir = tempfile::TempDir::new().expect("temp dir");
        let repo = dir.path();
        git(repo, &["init", "--quiet", "--initial-branch=main"]);
        git(repo, &["config", "user.name", "Test"]);
        git(repo, &["config", "user.email", "test@example.com"]);
        std::fs::write(repo.join("a.txt"), "one\n").expect("write");

        let status = parse_status(&text(
            run(
                repo,
                &[
                    "status",
                    "--porcelain=v1",
                    "-z",
                    "--branch",
                    "--untracked-files=all",
                ],
                &[],
            )
            .expect("status"),
        ));
        assert_eq!(status.files[0].unstaged, Some('?'));

        git(repo, &["add", "--", "a.txt"]);
        git(repo, &["rm", "--cached", "--quiet", "--", "a.txt"]);
        git(repo, &["add", "--all"]);
        git(repo, &["commit", "--quiet", "--message", "first"]);
        let log = parse_log(&text(
            run(
                repo,
                &["log", &format!("--pretty=format:{LOG_FORMAT}")],
                &[],
            )
            .expect("log"),
        ));
        assert_eq!(log[0].subject, "first");
    }
}
