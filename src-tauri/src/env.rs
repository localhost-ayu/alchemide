use serde::Serialize;

#[derive(Debug, PartialEq, Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum Environment {
    Windows,
    Linux,
    Wsl { distro: Option<String> },
}

pub fn detect(os: &str, proc_version: Option<&str>, wsl_distro: Option<&str>) -> Environment {
    if os == "windows" {
        return Environment::Windows;
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
pub fn get_environment() -> Environment {
    let proc_version = std::fs::read_to_string("/proc/version").ok();
    let wsl_distro = std::env::var("WSL_DISTRO_NAME").ok();
    detect(
        std::env::consts::OS,
        proc_version.as_deref(),
        wsl_distro.as_deref(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_wsl_from_proc_version() {
        let version = "Linux version 6.6.36.3-microsoft-standard-WSL2";
        assert_eq!(
            detect("linux", Some(version), None),
            Environment::Wsl { distro: None }
        );
    }

    #[test]
    fn detects_wsl_from_distro_variable() {
        assert_eq!(
            detect("linux", None, Some("Ubuntu")),
            Environment::Wsl {
                distro: Some("Ubuntu".into())
            }
        );
    }

    #[test]
    fn detects_plain_linux() {
        let version = "Linux version 6.8.0-45-generic";
        assert_eq!(detect("linux", Some(version), None), Environment::Linux);
    }

    #[test]
    fn detects_windows() {
        assert_eq!(detect("windows", None, None), Environment::Windows);
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
