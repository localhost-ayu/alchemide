use std::path::{Path, PathBuf};

use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
pub struct ServerSpec {
    pub key: &'static str,
    pub name: &'static str,
    pub program: &'static str,
    pub args: &'static [&'static str],
    pub install: &'static str,
}

const INTELEPHENSE: ServerSpec = ServerSpec {
    key: "php",
    name: "Intelephense",
    program: "intelephense",
    args: &["--stdio"],
    install: "npm install -g intelephense",
};

const TYPESCRIPT: ServerSpec = ServerSpec {
    key: "typescript",
    name: "TypeScript language server",
    program: "typescript-language-server",
    args: &["--stdio"],
    install: "npm install -g typescript-language-server typescript",
};

const SQLS: ServerSpec = ServerSpec {
    key: "sql",
    name: "sqls",
    program: "sqls",
    args: &[],
    install: "go install github.com/sqls-server/sqls@latest",
};

pub fn server_for(language: &str) -> Option<ServerSpec> {
    match language {
        "php" => Some(INTELEPHENSE),
        "javascript" | "typescript" | "jsx" | "tsx" => Some(TYPESCRIPT),
        "sql" => Some(SQLS),
        _ => None,
    }
}

pub fn find_program(
    program: &str,
    path_variable: Option<&str>,
    extensions: &[&str],
    is_file: impl Fn(&Path) -> bool,
) -> Option<PathBuf> {
    let path_variable = path_variable?;
    std::env::split_paths(path_variable)
        .filter(|dir| !dir.as_os_str().is_empty())
        .flat_map(|dir| {
            extensions
                .iter()
                .map(move |extension| dir.join(format!("{program}{extension}")))
        })
        .find(|candidate| is_file(candidate))
}

pub fn program_extensions(os: &str, pathext: Option<&str>) -> Vec<String> {
    if os != "windows" {
        return vec![String::new()];
    }
    pathext
        .unwrap_or(".COM;.EXE;.BAT;.CMD")
        .split(';')
        .filter(|extension| !extension.is_empty())
        .map(str::to_lowercase)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn picks_one_server_per_language_family() {
        assert_eq!(server_for("php").map(|s| s.key), Some("php"));
        for language in ["javascript", "typescript", "jsx", "tsx"] {
            assert_eq!(server_for(language).map(|s| s.key), Some("typescript"));
        }
        assert_eq!(server_for("sql").map(|s| s.program), Some("sqls"));
        assert_eq!(server_for("markdown"), None);
        assert_eq!(server_for("plaintext"), None);
    }

    #[test]
    fn finds_a_program_in_the_first_matching_folder() {
        let path = std::env::join_paths(["/usr/local/bin", "/usr/bin"])
            .expect("join")
            .into_string()
            .expect("utf-8");
        let found = find_program("sqls", Some(&path), &[""], |candidate| {
            candidate == Path::new("/usr/bin/sqls")
        });

        assert_eq!(found, Some(PathBuf::from("/usr/bin/sqls")));
    }

    #[test]
    fn tries_each_windows_extension_in_order() {
        let found = find_program(
            "intelephense",
            Some("npm"),
            &[".exe", ".cmd"],
            |candidate| candidate.ends_with("intelephense.cmd"),
        );

        assert_eq!(found, Some(Path::new("npm").join("intelephense.cmd")));
    }

    #[test]
    fn finds_nothing_without_a_path() {
        assert_eq!(find_program("sqls", None, &[""], |_| true), None);
        assert_eq!(find_program("sqls", Some(""), &[""], |_| true), None);
    }

    #[test]
    fn uses_pathext_only_on_windows() {
        assert_eq!(
            program_extensions("linux", Some(".EXE")),
            vec![String::new()]
        );
        assert_eq!(
            program_extensions("windows", Some(".EXE;.CMD;")),
            vec![".exe".to_string(), ".cmd".to_string()]
        );
        assert_eq!(program_extensions("windows", None).len(), 4);
    }
}
