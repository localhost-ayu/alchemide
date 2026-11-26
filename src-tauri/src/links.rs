use crate::error::{Error, Result};

pub fn is_external_url(url: &str) -> bool {
    let lower = url.trim().to_ascii_lowercase();
    let allowed = ["https://", "http://", "mailto:"]
        .iter()
        .any(|scheme| lower.starts_with(scheme) && lower.len() > scheme.len());
    allowed && !url.chars().any(char::is_control)
}

#[tauri::command]
pub async fn open_external(url: String) -> Result<()> {
    if !is_external_url(&url) {
        return Err(Error::UnsupportedLink);
    }
    tauri_plugin_opener::open_url(url.trim(), None::<&str>)
        .map_err(|error| Error::OpenLink(error.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_web_and_mail_links() {
        assert!(is_external_url(
            "https://github.com/localhost-ayu/alchemide"
        ));
        assert!(is_external_url("HTTP://example.com"));
        assert!(is_external_url("mailto:someone@example.com"));
    }

    #[test]
    fn rejects_everything_that_could_run_or_read_local_things() {
        for url in [
            "javascript:alert(1)",
            "file:///etc/passwd",
            "C:\\Windows\\System32\\calc.exe",
            "/usr/bin/xterm",
            "ms-settings:",
            "https://",
            "https://example.com/\nfile:///x",
            "",
        ] {
            assert!(!is_external_url(url), "{url:?} should be rejected");
        }
    }
}
