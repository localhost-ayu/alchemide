use std::path::{Component, Path};

use serde::Serialize;
use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, FilePath};

use crate::assets::{sanitize, unique_file_name};
use crate::config::config_dir;
use crate::error::{Error, Result};

const FOLDER: &str = "themes";
pub const MAX_THEME_SIZE: u64 = 1024 * 1024;

#[derive(Debug, PartialEq, Serialize)]
pub struct UserThemeFile {
    pub file: String,
    pub theme: Option<Value>,
}

pub fn is_theme_file_name(name: &str) -> bool {
    let path = Path::new(name);
    let mut components = path.components();
    let single =
        matches!(components.next(), Some(Component::Normal(_))) && components.next().is_none();
    let is_json = path
        .extension()
        .is_some_and(|ext| ext.eq_ignore_ascii_case("json"));
    single && is_json && !name.starts_with('.')
}

pub fn parse_theme_json(text: &str) -> Option<Value> {
    serde_json::from_str::<Value>(text)
        .ok()
        .filter(Value::is_object)
}

pub fn read_theme_file(path: &Path) -> Result<Option<Value>> {
    if std::fs::metadata(path)?.len() > MAX_THEME_SIZE {
        return Err(Error::TooLarge);
    }
    Ok(parse_theme_json(&std::fs::read_to_string(path)?))
}

pub fn read_user_themes(dir: &Path) -> Vec<UserThemeFile> {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut themes: Vec<UserThemeFile> = entries
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.path().is_file())
        .filter_map(|entry| {
            let file = entry.file_name().to_str()?.to_owned();
            if !is_theme_file_name(&file) {
                return None;
            }
            let theme = read_theme_file(&entry.path()).ok().flatten();
            Some(UserThemeFile { file, theme })
        })
        .collect();
    themes.sort_by(|a, b| a.file.cmp(&b.file));
    themes
}

fn theme_name(theme: &Value) -> Result<&str> {
    theme
        .get("name")
        .and_then(Value::as_str)
        .filter(|name| !name.trim().is_empty())
        .ok_or(Error::InvalidTheme)
}

pub fn write_user_theme(dir: &Path, file: Option<&str>, theme: &Value) -> Result<String> {
    let name = theme_name(theme)?;
    let file = match file {
        Some(file) if is_theme_file_name(file) => file.to_owned(),
        Some(_) => return Err(Error::InvalidThemeFile),
        None => unique_file_name(&sanitize(name, "theme"), "json", |candidate| {
            dir.join(candidate).exists()
        }),
    };
    std::fs::create_dir_all(dir)?;
    let text = serde_json::to_string_pretty(theme).map_err(|_| Error::InvalidTheme)?;
    let temporary = dir.join(format!(".{file}.tmp"));
    std::fs::write(&temporary, text)?;
    std::fs::rename(&temporary, dir.join(&file))?;
    Ok(file)
}

pub fn remove_user_theme(dir: &Path, file: &str) -> Result<()> {
    if !is_theme_file_name(file) {
        return Err(Error::InvalidThemeFile);
    }
    std::fs::remove_file(dir.join(file))?;
    Ok(())
}

pub fn export_file_name(name: &str) -> String {
    format!("{}.json", sanitize(name, "theme"))
}

pub fn write_export(path: &Path, theme: &Value) -> Result<()> {
    theme_name(theme)?;
    let text = serde_json::to_string_pretty(theme).map_err(|_| Error::InvalidTheme)?;
    std::fs::write(path, text)?;
    Ok(())
}

pub async fn run_dialog<T: Send + 'static>(
    pick: impl FnOnce() -> Option<T> + Send + 'static,
) -> Result<Option<T>> {
    tauri::async_runtime::spawn_blocking(pick)
        .await
        .map_err(|_| Error::Dialog)
}

pub fn local_path(picked: FilePath) -> Result<std::path::PathBuf> {
    picked.into_path().map_err(|_| Error::NotLocalFolder)
}

pub fn themes_dir() -> Result<std::path::PathBuf> {
    Ok(config_dir()?.join(FOLDER))
}

#[tauri::command]
pub async fn list_user_themes() -> Result<Vec<UserThemeFile>> {
    Ok(read_user_themes(&themes_dir()?))
}

#[tauri::command]
pub async fn save_user_theme(file: Option<String>, theme: Value) -> Result<String> {
    write_user_theme(&themes_dir()?, file.as_deref(), &theme)
}

#[tauri::command]
pub async fn delete_user_theme(file: String) -> Result<()> {
    remove_user_theme(&themes_dir()?, &file)
}

#[tauri::command]
pub async fn import_theme(app: AppHandle) -> Result<Option<Value>> {
    let picked = run_dialog(move || {
        app.dialog()
            .file()
            .add_filter("Theme", &["json"])
            .blocking_pick_file()
    })
    .await?;
    let Some(picked) = picked else {
        return Ok(None);
    };
    read_theme_file(&local_path(picked)?)?
        .map(Some)
        .ok_or(Error::InvalidTheme)
}

#[tauri::command]
pub async fn export_theme(app: AppHandle, theme: Value) -> Result<bool> {
    let file_name = export_file_name(theme_name(&theme)?);
    let picked = run_dialog(move || {
        app.dialog()
            .file()
            .add_filter("Theme", &["json"])
            .set_file_name(file_name)
            .blocking_save_file()
    })
    .await?;
    let Some(picked) = picked else {
        return Ok(false);
    };
    write_export(&local_path(picked)?, &theme)?;
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tempfile::TempDir;

    #[test]
    fn accepts_only_plain_json_file_names() {
        for good in ["lab.json", "Meu Tema.json", "noite-2.JSON"] {
            assert!(is_theme_file_name(good), "{good} should be accepted");
        }
        for bad in [
            "lab.txt",
            "../lab.json",
            "nested/lab.json",
            "/etc/lab.json",
            ".lab.json.tmp",
            ".json",
            "",
        ] {
            assert!(!is_theme_file_name(bad), "{bad} should be rejected");
        }
    }

    #[test]
    fn lists_themes_sorted_and_marks_broken_files() {
        let dir = TempDir::new().expect("temp dir");
        std::fs::write(dir.path().join("b.json"), r#"{ "name": "B" }"#).expect("write");
        std::fs::write(dir.path().join("a.json"), "{ broken").expect("write");
        std::fs::write(dir.path().join("list.json"), "[1]").expect("write");
        std::fs::write(dir.path().join("notes.txt"), "{}").expect("write");
        std::fs::create_dir(dir.path().join("folder.json")).expect("dir");

        let themes = read_user_themes(dir.path());

        assert_eq!(
            themes,
            vec![
                UserThemeFile {
                    file: "a.json".into(),
                    theme: None
                },
                UserThemeFile {
                    file: "b.json".into(),
                    theme: Some(json!({ "name": "B" }))
                },
                UserThemeFile {
                    file: "list.json".into(),
                    theme: None
                },
            ]
        );
    }

    #[test]
    fn lists_nothing_when_the_folder_is_missing() {
        let dir = TempDir::new().expect("temp dir");
        assert!(read_user_themes(&dir.path().join("themes")).is_empty());
    }

    #[test]
    fn names_new_themes_after_the_theme_without_overwriting() {
        let dir = TempDir::new().expect("temp dir");
        let folder = dir.path().join("themes");
        let theme = json!({ "name": "Noite Ácida" });

        let first = write_user_theme(&folder, None, &theme).expect("first");
        let second = write_user_theme(&folder, None, &theme).expect("second");

        assert_eq!(first, "noite-cida.json");
        assert_eq!(second, "noite-cida-2.json");
        assert_eq!(read_user_themes(&folder).len(), 2);
        assert!(!folder.join(".noite-cida.json.tmp").exists());
    }

    #[test]
    fn saves_in_place_when_the_file_is_given() {
        let dir = TempDir::new().expect("temp dir");
        let file = write_user_theme(dir.path(), None, &json!({ "name": "Lab" })).expect("create");

        write_user_theme(
            dir.path(),
            Some(&file),
            &json!({ "name": "Lab", "mood": "x" }),
        )
        .expect("update");

        assert_eq!(
            read_user_themes(dir.path()),
            vec![UserThemeFile {
                file,
                theme: Some(json!({ "name": "Lab", "mood": "x" }))
            }]
        );
    }

    #[test]
    fn refuses_themes_without_a_name_and_unsafe_file_names() {
        let dir = TempDir::new().expect("temp dir");
        assert!(matches!(
            write_user_theme(dir.path(), None, &json!({ "name": " " })),
            Err(Error::InvalidTheme)
        ));
        assert!(matches!(
            write_user_theme(
                dir.path(),
                Some("../settings.json"),
                &json!({ "name": "A" })
            ),
            Err(Error::InvalidThemeFile)
        ));
        assert!(matches!(
            remove_user_theme(dir.path(), "../settings.json"),
            Err(Error::InvalidThemeFile)
        ));
    }

    #[test]
    fn suggests_an_export_file_name_from_the_theme_name() {
        assert_eq!(export_file_name("Noite Ácida"), "noite-cida.json");
        assert_eq!(export_file_name("***"), "theme.json");
    }

    #[test]
    fn exports_a_named_theme_as_readable_json() {
        let dir = TempDir::new().expect("temp dir");
        let path = dir.path().join("lab.json");
        let theme = json!({ "name": "Lab", "ui": { "bg": "#000000" } });

        write_export(&path, &theme).expect("export");

        let text = std::fs::read_to_string(&path).expect("read");
        assert!(text.contains("\n  \"name\": \"Lab\""));
        assert_eq!(read_theme_file(&path).expect("read back"), Some(theme));
        assert!(matches!(
            write_export(&path, &json!({ "ui": {} })),
            Err(Error::InvalidTheme)
        ));
    }

    #[test]
    fn reads_only_json_objects_and_rejects_huge_files() {
        let dir = TempDir::new().expect("temp dir");
        let broken = dir.path().join("broken.json");
        std::fs::write(&broken, "{ nope").expect("write");
        let huge = dir.path().join("huge.json");
        std::fs::write(&huge, vec![b' '; (MAX_THEME_SIZE + 1) as usize]).expect("write");

        assert_eq!(read_theme_file(&broken).expect("read"), None);
        assert!(matches!(read_theme_file(&huge), Err(Error::TooLarge)));
    }

    #[test]
    fn removes_a_theme_file() {
        let dir = TempDir::new().expect("temp dir");
        let file = write_user_theme(dir.path(), None, &json!({ "name": "Lab" })).expect("create");

        remove_user_theme(dir.path(), &file).expect("remove");

        assert!(read_user_themes(dir.path()).is_empty());
    }
}
