use crate::error::{Error, Result};

pub const MIN_ZOOM: f64 = 0.7;
pub const MAX_ZOOM: f64 = 1.6;

pub fn clamp_zoom(scale: f64) -> f64 {
    if scale.is_finite() {
        scale.clamp(MIN_ZOOM, MAX_ZOOM)
    } else {
        1.0
    }
}

#[tauri::command]
pub fn set_zoom(window: tauri::WebviewWindow, scale: f64) -> Result<()> {
    window
        .set_zoom(clamp_zoom(scale))
        .map_err(|error| Error::Zoom(error.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_zoom_in_a_readable_range() {
        assert_eq!(clamp_zoom(1.25), 1.25);
        assert_eq!(clamp_zoom(0.1), MIN_ZOOM);
        assert_eq!(clamp_zoom(9.0), MAX_ZOOM);
        assert_eq!(clamp_zoom(f64::NAN), 1.0);
    }
}
