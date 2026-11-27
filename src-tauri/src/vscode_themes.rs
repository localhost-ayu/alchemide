use std::path::{Path, PathBuf};

use serde::Serialize;
use serde_json::{Map, Value};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

use crate::error::{Error, Result};
use crate::themes::{local_path, run_dialog};

const MAX_FILE_SIZE: u64 = 2 * 1024 * 1024;
const MAX_INCLUDE_DEPTH: usize = 5;

#[derive(Debug, Serialize, PartialEq, Eq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct VscodeTheme {
    pub label: String,
    pub extension: String,
    pub path: String,
    pub dark: bool,
}

pub fn strip_jsonc(text: &str) -> String {
    let mut without_comments = String::with_capacity(text.len());
    let mut chars = text.trim_start_matches('\u{feff}').chars().peekable();
    let mut in_string = false;
    while let Some(char) = chars.next() {
        if in_string {
            without_comments.push(char);
            if char == '\\' {
                if let Some(next) = chars.next() {
                    without_comments.push(next);
                }
            } else if char == '"' {
                in_string = false;
            }
        } else if char == '"' {
            in_string = true;
            without_comments.push(char);
        } else if char == '/' && chars.peek() == Some(&'/') {
            for next in chars.by_ref() {
                if next == '\n' {
                    without_comments.push('\n');
                    break;
                }
            }
        } else if char == '/' && chars.peek() == Some(&'*') {
            chars.next();
            let mut previous = ' ';
            for next in chars.by_ref() {
                if previous == '*' && next == '/' {
                    break;
                }
                previous = next;
            }
        } else {
            without_comments.push(char);
        }
    }
    remove_trailing_commas(&without_comments)
}

fn remove_trailing_commas(text: &str) -> String {
    let chars: Vec<char> = text.chars().collect();
    let mut result = String::with_capacity(text.len());
    let mut in_string = false;
    let mut index = 0;
    while index < chars.len() {
        let char = chars[index];
        if in_string {
            result.push(char);
            if char == '\\' {
                if let Some(next) = chars.get(index + 1) {
                    result.push(*next);
                    index += 1;
                }
            } else if char == '"' {
                in_string = false;
            }
        } else if char == '"' {
            in_string = true;
            result.push(char);
        } else if char == ',' {
            let next = chars[index + 1..].iter().find(|next| !next.is_whitespace());
            if !matches!(next, Some('}') | Some(']')) {
                result.push(char);
            }
        } else {
            result.push(char);
        }
        index += 1;
    }
    result
}

fn read_jsonc(path: &Path) -> Result<Value> {
    if std::fs::metadata(path)?.len() > MAX_FILE_SIZE {
        return Err(Error::TooLarge);
    }
    serde_json::from_str(&strip_jsonc(&std::fs::read_to_string(path)?))
        .map_err(|_| Error::InvalidThemeFile)
}

fn merge(base: Value, theme: &Value) -> Value {
    let mut merged = match base {
        Value::Object(map) => map,
        _ => Map::new(),
    };
    let mut colors = match merged.remove("colors") {
        Some(Value::Object(map)) => map,
        _ => Map::new(),
    };
    if let Some(Value::Object(own)) = theme.get("colors") {
        colors.extend(own.clone());
    }
    let mut token_colors = match merged.remove("tokenColors") {
        Some(Value::Array(rules)) => rules,
        _ => Vec::new(),
    };
    if let Some(Value::Array(own)) = theme.get("tokenColors") {
        token_colors.extend(own.iter().cloned());
    }
    for key in ["name", "type"] {
        if let Some(value) = theme.get(key) {
            merged.insert(key.into(), value.clone());
        }
    }
    merged.insert("colors".into(), Value::Object(colors));
    merged.insert("tokenColors".into(), Value::Array(token_colors));
    Value::Object(merged)
}

pub fn load_theme(path: &Path) -> Result<Value> {
    load_with_includes(path, 0)
}

fn load_with_includes(path: &Path, depth: usize) -> Result<Value> {
    let theme = read_jsonc(path)?;
    if !theme.is_object() {
        return Err(Error::InvalidThemeFile);
    }
    let base = match theme.get("include").and_then(Value::as_str) {
        Some(include) if depth < MAX_INCLUDE_DEPTH => {
            let folder = path.parent().unwrap_or(Path::new("."));
            load_with_includes(&folder.join(include), depth + 1)?
        }
        _ => Value::Object(Map::new()),
    };
    Ok(merge(base, &theme))
}

fn localized(label: &str, strings: &Value) -> Option<String> {
    let key = label.strip_prefix('%')?.strip_suffix('%')?;
    match strings.get(key)? {
        Value::String(text) => Some(text.clone()),
        Value::Object(entry) => entry.get("message")?.as_str().map(String::from),
        _ => None,
    }
}

pub fn themes_in_extension(dir: &Path) -> Vec<VscodeTheme> {
    let Ok(manifest) = read_jsonc(&dir.join("package.json")) else {
        return Vec::new();
    };
    let Some(themes) = manifest
        .pointer("/contributes/themes")
        .and_then(Value::as_array)
    else {
        return Vec::new();
    };
    let strings = read_jsonc(&dir.join("package.nls.json")).unwrap_or(Value::Null);
    let extension = manifest
        .get("displayName")
        .and_then(Value::as_str)
        .and_then(|name| localized(name, &strings).or_else(|| Some(name.to_string())))
        .or_else(|| {
            manifest
                .get("name")
                .and_then(Value::as_str)
                .map(String::from)
        })
        .unwrap_or_default();
    themes
        .iter()
        .filter_map(|theme| {
            let relative = theme.get("path")?.as_str()?;
            let path = dir.join(relative);
            if !relative.ends_with(".json") || !path.is_file() {
                return None;
            }
            let raw_label = theme.get("label").or_else(|| theme.get("id"))?.as_str()?;
            let label = localized(raw_label, &strings)
                .or_else(|| theme.get("id").and_then(Value::as_str).map(String::from))
                .unwrap_or_else(|| raw_label.to_string());
            let ui_theme = theme
                .get("uiTheme")
                .and_then(Value::as_str)
                .unwrap_or("vs-dark");
            Some(VscodeTheme {
                label,
                extension: extension.clone(),
                path: path.to_string_lossy().into_owned(),
                dark: ui_theme != "vs" && ui_theme != "hc-light",
            })
        })
        .collect()
}

fn child_dirs(dir: &Path) -> Vec<PathBuf> {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut dirs: Vec<PathBuf> = entries
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.file_type().is_ok_and(|kind| kind.is_dir()))
        .map(|entry| entry.path())
        .collect();
    dirs.sort();
    dirs
}

pub fn extension_roots(home: Option<&Path>, installs: &[PathBuf]) -> Vec<PathBuf> {
    let mut roots = Vec::new();
    for install in installs {
        let bundled = install.join("resources").join("app").join("extensions");
        if bundled.is_dir() {
            roots.push(bundled);
        }
        for child in child_dirs(install) {
            let versioned = child.join("resources").join("app").join("extensions");
            if versioned.is_dir() {
                roots.push(versioned);
            }
        }
    }
    if let Some(home) = home {
        roots.push(home.join(".vscode").join("extensions"));
    }
    roots
}

pub fn list_themes(roots: &[PathBuf]) -> Vec<VscodeTheme> {
    let mut themes: Vec<VscodeTheme> = roots
        .iter()
        .flat_map(|root| child_dirs(root))
        .flat_map(|dir| themes_in_extension(&dir))
        .collect();
    themes.sort_by_key(|theme| theme.label.to_lowercase());
    themes.dedup_by(|a, b| a.path == b.path);
    themes
}

fn install_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    if cfg!(windows) {
        if let Some(local) = dirs::data_local_dir() {
            dirs.push(local.join("Programs").join("Microsoft VS Code"));
        }
        if let Some(program_files) = std::env::var_os("ProgramFiles") {
            dirs.push(PathBuf::from(program_files).join("Microsoft VS Code"));
        }
    } else {
        for dir in [
            "/usr/share/code",
            "/opt/visual-studio-code",
            "/snap/code/current/usr/share/code",
        ] {
            dirs.push(PathBuf::from(dir));
        }
    }
    dirs
}

fn installed_themes() -> Vec<VscodeTheme> {
    list_themes(&extension_roots(
        dirs::home_dir().as_deref(),
        &install_dirs(),
    ))
}

#[tauri::command]
pub async fn list_vscode_themes() -> Result<Vec<VscodeTheme>> {
    Ok(installed_themes())
}

#[tauri::command]
pub async fn load_vscode_theme(path: String) -> Result<Value> {
    if !installed_themes().iter().any(|theme| theme.path == path) {
        return Err(Error::InvalidThemeFile);
    }
    load_theme(Path::new(&path))
}

#[tauri::command]
pub async fn pick_vscode_theme(app: AppHandle) -> Result<Option<Value>> {
    let picked = run_dialog(move || {
        app.dialog()
            .file()
            .add_filter("VS Code theme", &["json"])
            .blocking_pick_file()
    })
    .await?;
    match picked {
        Some(picked) => load_theme(&local_path(picked)?).map(Some),
        None => Ok(None),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tempfile::TempDir;

    fn write(path: &Path, text: &str) {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).expect("mkdir");
        }
        std::fs::write(path, text).expect("write");
    }

    #[test]
    fn strips_comments_and_trailing_commas_outside_strings() {
        let text = "\u{feff}// head\n{ \"a\": \"//not\", /* b */ \"c\": [1, 2,], }";
        let value: Value = serde_json::from_str(&strip_jsonc(text)).expect("json");
        assert_eq!(value, json!({ "a": "//not", "c": [1, 2] }));
    }

    #[test]
    fn merges_included_themes() {
        let dir = TempDir::new().expect("temp dir");
        write(
            &dir.path().join("base.json"),
            r##"{ "name": "Base", "colors": { "editor.background": "#000000", "focusBorder": "#111111" },
               "tokenColors": [{ "scope": "comment", "settings": { "foreground": "#222222" } }] }"##,
        );
        write(
            &dir.path().join("plus.json"),
            r##"{ "name": "Plus", "include": "./base.json", // comment
               "colors": { "focusBorder": "#333333" },
               "tokenColors": [{ "scope": "string", "settings": { "foreground": "#444444" } }], }"##,
        );

        let theme = load_theme(&dir.path().join("plus.json")).expect("load");

        assert_eq!(theme["name"], "Plus");
        assert_eq!(theme["colors"]["editor.background"], "#000000");
        assert_eq!(theme["colors"]["focusBorder"], "#333333");
        assert_eq!(theme["tokenColors"].as_array().map(Vec::len), Some(2));
        assert_eq!(theme["tokenColors"][1]["scope"], "string");
    }

    #[test]
    fn stops_include_loops() {
        let dir = TempDir::new().expect("temp dir");
        write(&dir.path().join("a.json"), r#"{ "include": "./a.json" }"#);
        assert!(load_theme(&dir.path().join("a.json")).is_ok());
    }

    #[test]
    fn lists_themes_with_localized_labels() {
        let dir = TempDir::new().expect("temp dir");
        let extension = dir.path().join("extensions").join("theme-defaults");
        write(
            &extension.join("package.json"),
            r#"{ "name": "theme-defaults", "displayName": "%displayName%", "contributes": { "themes": [
                { "id": "Dark+", "label": "%darkPlus%", "uiTheme": "vs-dark", "path": "./themes/dark_plus.json" },
                { "id": "Light+", "label": "%lightPlus%", "uiTheme": "vs", "path": "./themes/light_plus.json" },
                { "id": "Missing", "label": "Missing", "uiTheme": "vs", "path": "./themes/missing.json" },
                { "id": "Old", "label": "Old", "uiTheme": "vs", "path": "./themes/old.tmTheme" }
            ] } }"#,
        );
        write(
            &extension.join("package.nls.json"),
            r#"{ "displayName": "Default Themes", "darkPlus": "Dark+", "lightPlus": { "message": "Light+" } }"#,
        );
        write(&extension.join("themes").join("dark_plus.json"), "{}");
        write(&extension.join("themes").join("light_plus.json"), "{}");
        write(&extension.join("themes").join("old.tmTheme"), "<plist/>");

        let themes = list_themes(&[dir.path().join("extensions")]);

        let labels: Vec<(&str, &str, bool)> = themes
            .iter()
            .map(|theme| (theme.label.as_str(), theme.extension.as_str(), theme.dark))
            .collect();
        assert_eq!(
            labels,
            [
                ("Dark+", "Default Themes", true),
                ("Light+", "Default Themes", false)
            ]
        );
    }

    #[test]
    fn finds_bundled_and_versioned_installs_and_user_extensions() {
        let dir = TempDir::new().expect("temp dir");
        let install = dir.path().join("Microsoft VS Code");
        let versioned = install
            .join("8a14f0cc1b")
            .join("resources")
            .join("app")
            .join("extensions");
        std::fs::create_dir_all(&versioned).expect("mkdir");

        let roots = extension_roots(Some(Path::new("/home/me")), &[install]);

        assert_eq!(
            roots,
            [
                versioned,
                Path::new("/home/me").join(".vscode").join("extensions")
            ]
        );
    }
}
