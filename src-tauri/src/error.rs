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
    #[error("could not change the zoom: {0}")]
    Zoom(String),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("could not watch the folder for changes: {0}")]
    Watch(#[from] notify::Error),
}

impl Serialize for Error {
    fn serialize<S: Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

pub type Result<T> = std::result::Result<T, Error>;
