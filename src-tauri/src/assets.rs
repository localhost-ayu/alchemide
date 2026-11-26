use std::path::{Component, Path, PathBuf};

use serde::Deserialize;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

use crate::config::config_dir;
use crate::error::{Error, Result};

const MAX_SIZE: u64 = 100 * 1024 * 1024;

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AssetKind {
    Background,
    Mascot,
}

impl AssetKind {
    fn folder(self) -> &'static str {
        match self {
            AssetKind::Background => "backgrounds",
            AssetKind::Mascot => "mascots",
        }
    }

    fn extensions(self) -> &'static [&'static str] {
        match self {
            AssetKind::Background => &["png", "jpg", "jpeg", "webp", "gif", "mp4", "webm"],
            AssetKind::Mascot => &["png", "webp", "gif"],
        }
    }
}

pub fn asset_file_name(
    kind: AssetKind,
    original: &Path,
    exists: impl Fn(&str) -> bool,
) -> Result<String> {
    let extension = original
        .extension()
        .map(|ext| ext.to_string_lossy().to_lowercase())
        .filter(|ext| kind.extensions().contains(&ext.as_str()))
        .ok_or(Error::UnsupportedAsset)?;
    let stem = sanitize(&original.file_stem().unwrap_or_default().to_string_lossy());
    let mut name = format!("{stem}.{extension}");
    let mut counter = 2;
    while exists(&name) {
        name = format!("{stem}-{counter}.{extension}");
        counter += 1;
    }
    Ok(name)
}

fn sanitize(stem: &str) -> String {
    let cleaned: String = stem
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '_' || c == '-' {
                c.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect();
    let trimmed = cleaned
        .split('-')
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join("-");
    if trimmed.is_empty() {
        "asset".into()
    } else {
        trimmed
    }
}

pub fn resolve_asset(config: &Path, relative: &str) -> Result<PathBuf> {
    let path = Path::new(relative);
    let mut components = path.components();
    let folder_ok = matches!(
        components.next(),
        Some(Component::Normal(folder)) if folder == "backgrounds" || folder == "mascots"
    );
    let rest_ok = components.all(|component| matches!(component, Component::Normal(_)));
    if !folder_ok || !rest_ok || path.components().count() != 2 {
        return Err(Error::InvalidAssetPath);
    }
    Ok(config.join(path))
}

#[tauri::command]
pub async fn import_asset(app: AppHandle, kind: AssetKind) -> Result<Option<String>> {
    let picked = tauri::async_runtime::spawn_blocking(move || {
        app.dialog()
            .file()
            .add_filter("Media", kind.extensions())
            .blocking_pick_file()
    })
    .await
    .map_err(|_| Error::Dialog)?;
    let Some(picked) = picked else {
        return Ok(None);
    };
    let source = picked.into_path().map_err(|_| Error::NotLocalFolder)?;
    if std::fs::metadata(&source)?.len() > MAX_SIZE {
        return Err(Error::TooLarge);
    }
    let folder = config_dir()?.join(kind.folder());
    std::fs::create_dir_all(&folder)?;
    let name = asset_file_name(kind, &source, |name| folder.join(name).exists())?;
    std::fs::copy(&source, folder.join(&name))?;
    Ok(Some(format!("{}/{name}", kind.folder())))
}

#[tauri::command]
pub async fn asset_path(relative: String) -> Result<String> {
    let path = resolve_asset(&config_dir()?, &relative)?;
    Ok(path.to_string_lossy().into_owned())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn name(kind: AssetKind, original: &str) -> Result<String> {
        asset_file_name(kind, Path::new(original), |_| false)
    }

    #[test]
    fn keeps_a_clean_lowercase_name() {
        assert_eq!(
            name(AssetKind::Background, "/home/me/Lab Night.PNG").ok(),
            Some("lab-night.png".into())
        );
    }

    #[test]
    fn replaces_unsafe_characters() {
        assert_eq!(
            name(AssetKind::Mascot, "menina_ç@#!.webp").ok(),
            Some("menina_.webp".into())
        );
        assert_eq!(
            name(AssetKind::Mascot, "ééé.png").ok(),
            Some("asset.png".into())
        );
    }

    #[test]
    fn numbers_names_that_already_exist() {
        let taken = ["lab.png", "lab-2.png"];
        let result = asset_file_name(AssetKind::Background, Path::new("lab.png"), |name| {
            taken.contains(&name)
        });
        assert_eq!(result.ok(), Some("lab-3.png".into()));
    }

    #[test]
    fn accepts_videos_only_as_backgrounds() {
        assert!(name(AssetKind::Background, "loop.webm").is_ok());
        assert!(matches!(
            name(AssetKind::Mascot, "loop.webm"),
            Err(Error::UnsupportedAsset)
        ));
        assert!(matches!(
            name(AssetKind::Background, "notes.txt"),
            Err(Error::UnsupportedAsset)
        ));
    }

    #[test]
    fn resolves_assets_inside_their_folders_only() {
        let config = Path::new("/home/me/.config/alchemide");
        assert_eq!(
            resolve_asset(config, "backgrounds/lab.png").ok(),
            Some(config.join("backgrounds/lab.png"))
        );
        for bad in [
            "settings.json",
            "../secret.png",
            "backgrounds/../settings.json",
            "/etc/passwd",
            "mascots/nested/a.png",
            "other/a.png",
        ] {
            assert!(
                resolve_asset(config, bad).is_err(),
                "{bad} should be rejected"
            );
        }
    }
}
