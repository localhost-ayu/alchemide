use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Profile {
    pub id: String,
    pub label: String,
    #[serde(skip)]
    pub program: String,
    #[serde(skip)]
    pub args: Vec<String>,
    #[serde(skip)]
    pub uses_project_folder: bool,
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

pub fn parse_distros(output: &[u8]) -> Vec<String> {
    let text = if output.contains(&0) {
        let units: Vec<u16> = output
            .as_chunks::<2>()
            .0
            .iter()
            .map(|pair| u16::from_le_bytes(*pair))
            .collect();
        String::from_utf16_lossy(&units)
    } else {
        String::from_utf8_lossy(output).into_owned()
    };
    text.lines()
        .map(|line| line.trim_matches(|c: char| c.is_whitespace() || c == '\u{feff}'))
        .filter(|line| !line.is_empty())
        .map(String::from)
        .collect()
}

fn wsl_profile(distro: &str, path: &str) -> Profile {
    Profile {
        id: format!("wsl:{distro}"),
        label: format!("WSL · {distro}"),
        program: "wsl.exe".into(),
        args: vec!["-d".into(), distro.into(), "--cd".into(), path.into()],
        uses_project_folder: false,
    }
}

pub fn profiles(
    os: &str,
    shell_variable: Option<&str>,
    project_folder: Option<&str>,
    distros: &[String],
) -> Vec<Profile> {
    if os != "windows" {
        let program = shell_variable
            .filter(|shell| !shell.trim().is_empty())
            .unwrap_or("/bin/sh");
        return vec![Profile {
            id: "shell".into(),
            label: program.rsplit('/').next().unwrap_or(program).into(),
            program: program.into(),
            args: vec![],
            uses_project_folder: true,
        }];
    }
    let project_in_wsl = project_folder.and_then(wsl_location);
    let mut list = Vec::new();
    if let Some(location) = &project_in_wsl {
        list.push(wsl_profile(&location.distro, &location.path));
    }
    list.push(Profile {
        id: "powershell".into(),
        label: "PowerShell".into(),
        program: "powershell.exe".into(),
        args: vec!["-NoLogo".into()],
        uses_project_folder: project_in_wsl.is_none(),
    });
    for distro in distros {
        let already_listed = project_in_wsl
            .as_ref()
            .is_some_and(|location| location.distro.eq_ignore_ascii_case(distro));
        if !already_listed {
            list.push(wsl_profile(distro, "~"));
        }
    }
    list
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
    fn reads_the_utf16_output_of_wsl_list() {
        let output: Vec<u8> = "\u{feff}Ubuntu\r\nDebian\r\n\r\n"
            .encode_utf16()
            .flat_map(u16::to_le_bytes)
            .collect();
        assert_eq!(parse_distros(&output), ["Ubuntu", "Debian"]);
        assert_eq!(parse_distros(b"Ubuntu-22.04\n"), ["Ubuntu-22.04"]);
        assert!(parse_distros(b"").is_empty());
    }

    #[test]
    fn linux_and_wsl_use_the_shell_variable() {
        let list = profiles("linux", Some("/usr/bin/zsh"), Some("/home/nat/app"), &[]);
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].program, "/usr/bin/zsh");
        assert_eq!(list[0].label, "zsh");
        assert!(list[0].uses_project_folder);
        assert_eq!(profiles("linux", None, None, &[])[0].program, "/bin/sh");
    }

    #[test]
    fn windows_starts_with_powershell_and_offers_each_distro() {
        let distros = ["Ubuntu".to_string(), "Debian".to_string()];
        let list = profiles("windows", None, Some(r"C:\code\app"), &distros);
        let labels: Vec<_> = list.iter().map(|profile| profile.label.as_str()).collect();
        assert_eq!(labels, ["PowerShell", "WSL · Ubuntu", "WSL · Debian"]);
        assert!(list[0].uses_project_folder);
        assert_eq!(list[1].args, ["-d", "Ubuntu", "--cd", "~"]);
    }

    #[test]
    fn windows_opens_wsl_first_for_projects_inside_wsl() {
        let distros = ["Ubuntu".to_string(), "Debian".to_string()];
        let list = profiles(
            "windows",
            None,
            Some(r"\\wsl.localhost\Ubuntu\home\nat\app"),
            &distros,
        );
        let labels: Vec<_> = list.iter().map(|profile| profile.label.as_str()).collect();
        assert_eq!(labels, ["WSL · Ubuntu", "PowerShell", "WSL · Debian"]);
        assert_eq!(list[0].program, "wsl.exe");
        assert_eq!(list[0].args, ["-d", "Ubuntu", "--cd", "/home/nat/app"]);
        assert!(!list[1].uses_project_folder);
    }
}
