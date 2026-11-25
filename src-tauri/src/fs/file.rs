use serde::Serialize;

use crate::error::{Error, Result};

const BOM: &[u8] = b"\xEF\xBB\xBF";
const MAX_SIZE: usize = 20 * 1024 * 1024;

#[derive(Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileContent {
    pub text: String,
    pub has_bom: bool,
}

pub fn decode(bytes: Vec<u8>) -> Result<FileContent> {
    if bytes.len() > MAX_SIZE {
        return Err(Error::TooLarge);
    }
    let has_bom = bytes.starts_with(BOM);
    let body = if has_bom {
        bytes[BOM.len()..].to_vec()
    } else {
        bytes
    };
    let text = String::from_utf8(body).map_err(|_| Error::NotUtf8)?;
    Ok(FileContent { text, has_bom })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_plain_utf8() {
        let content = decode("olá\n".as_bytes().to_vec()).expect("utf-8");
        assert_eq!(content.text, "olá\n");
        assert!(!content.has_bom);
    }

    #[test]
    fn strips_and_reports_the_bom() {
        let content = decode(b"\xEF\xBB\xBFhi".to_vec()).expect("utf-8 with bom");
        assert_eq!(content.text, "hi");
        assert!(content.has_bom);
    }

    #[test]
    fn rejects_binary_content() {
        assert!(matches!(
            decode(vec![0xff, 0xfe, 0x00]),
            Err(Error::NotUtf8)
        ));
    }

    #[test]
    fn rejects_files_that_are_too_large() {
        assert!(matches!(
            decode(vec![b'a'; MAX_SIZE + 1]),
            Err(Error::TooLarge)
        ));
    }
}
