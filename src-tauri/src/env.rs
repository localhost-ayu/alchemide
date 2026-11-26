use serde::Serialize;
use tauri::State;

use crate::error::Result;
use crate::fs::Workspace;

#[derive(Debug, PartialEq, Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum Environment {
    Windows,
    Linux,
    Wsl { distro: Option<String> },
}

#[derive(Debug, PartialEq)]
pub struct WslLocation {
    pub distro: String,
    pub path: String,
}

pub fn wsl_location(windows_path: &str) -> Option<WslLocation> {
    let normalized = windows_path.replace('/', "\\");
    let lower = normalized.to_lowercase();
    let rest = ["\\\\wsl$\\", "\\\\wsl.localhost\\"]
        .iter()
        .find(|prefix| lower.starts_with(*prefix))
        .map(|prefix| &normalized[prefix.len()..])?;
    let mut parts = rest.split('\\').filter(|part| !part.is_empty());
    let distro = parts.next()?.to_string();
    let path = format!("/{}", parts.collect::<Vec<_>>().join("/"));
    Some(WslLocation { distro, path })
}

pub fn detect(
    os: &str,
    proc_version: Option<&str>,
    wsl_distro: Option<&str>,
    project_folder: Option<&str>,
) -> Environment {
    if os == "windows" {
        return match project_folder.and_then(wsl_location) {
            Some(location) => Environment::Wsl {
                distro: Some(location.distro),
            },
            None => Environment::Windows,
        };
    }
    let is_wsl = wsl_distro.is_some()
        || proc_version.is_some_and(|v| v.to_lowercase().contains("microsoft"));
    if is_wsl {
        Environment::Wsl {
            distro: wsl_distro.map(String::from),
        }
    } else {
        Environment::Linux
    }
}

#[tauri::command]
pub async fn get_environment(workspace: State<'_, Workspace>) -> Result<Environment> {
    let proc_version = std::fs::read_to_string("/proc/version").ok();
    let wsl_distro = std::env::var("WSL_DISTRO_NAME").ok();
    let folder = workspace
        .root()
        .map(|root| root.to_string_lossy().into_owned());
    Ok(detect(
        std::env::consts::OS,
        proc_version.as_deref(),
        wsl_distro.as_deref(),
        folder.as_deref(),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_wsl_dollar_paths() {
        assert_eq!(
            wsl_location(r"\\wsl$\Ubuntu\home\nat\alchemide"),
            Some(WslLocation {
                distro: "Ubuntu".into(),
                path: "/home/nat/alchemide".into()
            })
        );
    }

    #[test]
    fn converts_wsl_localhost_paths_with_any_case_or_slash() {
        assert_eq!(
            wsl_location("//WSL.localhost/Debian/srv/app/"),
            Some(WslLocation {
                distro: "Debian".into(),
                path: "/srv/app".into()
            })
        );
        assert_eq!(
            wsl_location(r"\\wsl.localhost\Ubuntu"),
            Some(WslLocation {
                distro: "Ubuntu".into(),
                path: "/".into()
            })
        );
    }

    #[test]
    fn ignores_regular_windows_paths() {
        assert_eq!(wsl_location(r"C:\code\alchemide"), None);
        assert_eq!(wsl_location(r"\\server\share\x"), None);
        assert_eq!(wsl_location(r"\\wsl$\"), None);
    }

    #[test]
    fn windows_reports_wsl_for_a_project_inside_wsl() {
        assert_eq!(
            detect(
                "windows",
                None,
                None,
                Some(r"\\wsl.localhost\Ubuntu\home\nat\app")
            ),
            Environment::Wsl {
                distro: Some("Ubuntu".into())
            }
        );
        assert_eq!(
            detect("windows", None, None, Some(r"C:\code\app")),
            Environment::Windows
        );
    }

    #[test]
    fn detects_wsl_from_proc_version() {
        let version = "Linux version 6.6.36.3-microsoft-standard-WSL2";
        assert_eq!(
            detect("linux", Some(version), None, None),
            Environment::Wsl { distro: None }
        );
    }

    #[test]
    fn detects_wsl_from_distro_variable() {
        assert_eq!(
            detect("linux", None, Some("Ubuntu"), None),
            Environment::Wsl {
                distro: Some("Ubuntu".into())
            }
        );
    }

    #[test]
    fn detects_plain_linux() {
        let version = "Linux version 6.8.0-45-generic";
        assert_eq!(
            detect("linux", Some(version), None, None),
            Environment::Linux
        );
    }

    #[test]
    fn detects_windows() {
        assert_eq!(detect("windows", None, None, None), Environment::Windows);
    }

    #[test]
    fn serializes_with_kind_tag() {
        let wsl = Environment::Wsl {
            distro: Some("Ubuntu".into()),
        };
        assert_eq!(
            serde_json::to_string(&wsl).ok().as_deref(),
            Some(r#"{"kind":"wsl","distro":"Ubuntu"}"#)
        );
    }
}
