use serde::{Serialize, Serializer};

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("the folder dialog could not be shown")]
    Dialog,
    #[error("the selected location is not a local folder")]
    NotLocalFolder,
    #[error("no folder is open")]
    NoWorkspace,
    #[error("the path is outside the open folder")]
    OutsideWorkspace,
    #[error("the file is not valid UTF-8 text")]
    NotUtf8,
    #[error("the file is too large to open")]
    TooLarge,
    #[error("the system config folder could not be found")]
    NoConfigDir,
    #[error("settings must be a JSON object")]
    InvalidSettings,
    #[error("this file type is not supported here")]
    UnsupportedAsset,
    #[error("the path is not inside the backgrounds or mascots folder")]
    InvalidAssetPath,
    #[error("this language server is no longer running")]
    NoLanguageServerSession,
    #[error("language server error: {0}")]
    LanguageServer(String),
    #[error("a theme must be a JSON object with a name")]
    InvalidTheme,
    #[error("the theme file name is not valid")]
    InvalidThemeFile,
    #[error("terminal error: {0}")]
    Terminal(String),
    #[error("this terminal is no longer open")]
    NoTerminal,
    #[error("this terminal profile is not available")]
    NoProfile,
    #[error("only web and mail links can be opened")]
    UnsupportedLink,
    #[error("could not open the link: {0}")]
    OpenLink(String),
    #[error("type something to search")]
    EmptySearch,
    #[error("invalid search pattern: {0}")]
    InvalidPattern(String),
    #[error("could not update: {0}")]
    Update(String),
    #[error("there is no update to install")]
    NoUpdate,
    #[error("that name cannot be used for a file or folder")]
    InvalidName,
    #[error("a file or folder with that name already exists")]
    AlreadyExists,
    #[error("the open folder itself cannot be renamed or deleted")]
    WorkspaceRoot,
    #[error("could not move it to the trash: {0}")]
    Trash(String),
    #[error("git is not installed or not on the PATH")]
    GitMissing,
    #[error("the open folder is not a git repository")]
    NotARepository,
    #[error("git: {0}")]
    Git(String),
    #[error("Docker is not installed or not on the PATH")]
    DockerMissing,
    #[error("Docker: {0}")]
    Docker(String),
    #[error("could not change the zoom: {0}")]
    Zoom(String),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("could not watch the folder for changes: {0}")]
    Watch(#[from] notify::Error),
}

impl Error {
    pub fn code(&self) -> &'static str {
        match self {
            Error::Dialog => "Dialog",
            Error::NotLocalFolder => "NotLocalFolder",
            Error::NoWorkspace => "NoWorkspace",
            Error::OutsideWorkspace => "OutsideWorkspace",
            Error::NotUtf8 => "NotUtf8",
            Error::TooLarge => "TooLarge",
            Error::NoConfigDir => "NoConfigDir",
            Error::InvalidSettings => "InvalidSettings",
            Error::UnsupportedAsset => "UnsupportedAsset",
            Error::InvalidAssetPath => "InvalidAssetPath",
            Error::NoLanguageServerSession => "NoLanguageServerSession",
            Error::InvalidTheme => "InvalidTheme",
            Error::InvalidThemeFile => "InvalidThemeFile",
            Error::NoTerminal => "NoTerminal",
            Error::NoProfile => "NoProfile",
            Error::UnsupportedLink => "UnsupportedLink",
            Error::EmptySearch => "EmptySearch",
            Error::NoUpdate => "NoUpdate",
            Error::InvalidName => "InvalidName",
            Error::AlreadyExists => "AlreadyExists",
            Error::WorkspaceRoot => "WorkspaceRoot",
            Error::GitMissing => "GitMissing",
            Error::NotARepository => "NotARepository",
            Error::DockerMissing => "DockerMissing",
            Error::LanguageServer(_) => "LanguageServer",
            Error::Terminal(_) => "Terminal",
            Error::OpenLink(_) => "OpenLink",
            Error::InvalidPattern(_) => "InvalidPattern",
            Error::Update(_) => "Update",
            Error::Trash(_) => "Trash",
            Error::Git(_) => "Git",
            Error::Docker(_) => "Docker",
            Error::Zoom(_) => "Zoom",
            Error::Io(_) => "Io",
            Error::Watch(_) => "Watch",
        }
    }

    pub fn detail(&self) -> Option<String> {
        match self {
            Error::LanguageServer(detail)
            | Error::Terminal(detail)
            | Error::OpenLink(detail)
            | Error::InvalidPattern(detail)
            | Error::Update(detail)
            | Error::Trash(detail)
            | Error::Git(detail)
            | Error::Docker(detail)
            | Error::Zoom(detail) => Some(detail.clone()),
            Error::Io(error) => Some(error.to_string()),
            Error::Watch(error) => Some(error.to_string()),
            _ => None,
        }
    }
}

#[derive(Serialize)]
struct Payload {
    code: &'static str,
    message: String,
    detail: Option<String>,
}

impl Serialize for Error {
    fn serialize<S: Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
        Payload {
            code: self.code(),
            message: self.to_string(),
            detail: self.detail(),
        }
        .serialize(serializer)
    }
}

pub type Result<T> = std::result::Result<T, Error>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serializes_a_code_the_english_message_and_the_detail() {
        let plain = serde_json::to_value(Error::AlreadyExists).expect("json");
        assert_eq!(plain["code"], "AlreadyExists");
        assert_eq!(
            plain["message"],
            "a file or folder with that name already exists"
        );
        assert!(plain["detail"].is_null());

        let detailed = serde_json::to_value(Error::Git("bad ref".into())).expect("json");
        assert_eq!(detailed["code"], "Git");
        assert_eq!(detailed["message"], "git: bad ref");
        assert_eq!(detailed["detail"], "bad ref");

        let io = std::io::Error::new(std::io::ErrorKind::NotFound, "missing");
        assert_eq!(
            serde_json::to_value(Error::Io(io)).expect("json")["code"],
            "Io"
        );
    }
}
