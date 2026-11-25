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
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

impl Serialize for Error {
    fn serialize<S: Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

pub type Result<T> = std::result::Result<T, Error>;
