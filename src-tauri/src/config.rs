use std::path::{Path, PathBuf};

use serde_json::{Map, Value};

use crate::error::{Error, Result};

const FILE_NAME: &str = "settings.json";

pub fn config_dir() -> Result<PathBuf> {
    dirs::config_dir()
        .map(|dir| dir.join("alchemide"))
        .ok_or(Error::NoConfigDir)
}

pub fn parse_settings(text: Option<&str>) -> Value {
    text.and_then(|text| serde_json::from_str::<Value>(text).ok())
        .filter(Value::is_object)
        .unwrap_or_else(|| Value::Object(Map::new()))
}

pub fn write_settings(dir: &Path, settings: &Value) -> Result<()> {
    if !settings.is_object() {
        return Err(Error::InvalidSettings);
    }
    std::fs::create_dir_all(dir)?;
    let text = serde_json::to_string_pretty(settings).map_err(|_| Error::InvalidSettings)?;
    let temporary = dir.join(format!("{FILE_NAME}.tmp"));
    std::fs::write(&temporary, text)?;
    std::fs::rename(&temporary, dir.join(FILE_NAME))?;
    Ok(())
}

pub fn read_settings(dir: &Path) -> Value {
    parse_settings(std::fs::read_to_string(dir.join(FILE_NAME)).ok().as_deref())
}

#[tauri::command]
pub async fn load_settings() -> Result<Value> {
    Ok(read_settings(&config_dir()?))
}

#[tauri::command]
pub async fn save_settings(settings: Value) -> Result<()> {
    write_settings(&config_dir()?, &settings)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tempfile::TempDir;

    #[test]
    fn starts_empty_without_a_file() {
        assert_eq!(parse_settings(None), json!({}));
    }

    #[test]
    fn ignores_broken_or_non_object_files() {
        assert_eq!(parse_settings(Some("{ not json")), json!({}));
        assert_eq!(parse_settings(Some("[1, 2]")), json!({}));
    }

    #[test]
    fn round_trips_settings_through_the_config_folder() {
        let dir = TempDir::new().expect("temp dir");
        let folder = dir.path().join("alchemide");
        let settings = json!({ "theme": "Maré", "effects": { "surface": "solid" } });

        write_settings(&folder, &settings).expect("write");

        assert_eq!(read_settings(&folder), settings);
        assert!(!folder.join("settings.json.tmp").exists());
    }

    #[test]
    fn refuses_to_write_anything_but_an_object() {
        let dir = TempDir::new().expect("temp dir");
        assert!(matches!(
            write_settings(dir.path(), &json!("theme")),
            Err(Error::InvalidSettings)
        ));
    }
}
