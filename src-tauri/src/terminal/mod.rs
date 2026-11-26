use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};

use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::error::{Error, Result};
use crate::fs::Workspace;

mod profiles;

pub use profiles::Profile;

pub const OUTPUT_EVENT: &str = "terminal-output";
pub const EXIT_EVENT: &str = "terminal-exit";

pub fn split_complete_utf8(bytes: &[u8]) -> usize {
    match std::str::from_utf8(bytes) {
        Ok(_) => bytes.len(),
        Err(error) if error.error_len().is_none() => error.valid_up_to(),
        Err(_) => bytes.len(),
    }
}

struct Session {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    child: Box<dyn Child + Send + Sync>,
}

#[derive(Default)]
pub struct Terminals {
    sessions: Arc<Mutex<HashMap<u32, Session>>>,
    next_id: AtomicU32,
}

impl Terminals {
    fn lock(&self) -> MutexGuard<'_, HashMap<u32, Session>> {
        self.sessions
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
    }
}

#[derive(Clone, Serialize)]
struct Output {
    id: u32,
    data: String,
}

fn size(cols: u16, rows: u16) -> PtySize {
    PtySize {
        rows: rows.max(1),
        cols: cols.max(1),
        pixel_width: 0,
        pixel_height: 0,
    }
}

fn pty_error(error: impl std::fmt::Display) -> Error {
    Error::Terminal(error.to_string())
}

fn forward_output(app: AppHandle, id: u32, mut reader: Box<dyn Read + Send>) {
    std::thread::spawn(move || {
        let mut buffer = [0u8; 8192];
        let mut pending: Vec<u8> = Vec::new();
        while let Ok(read) = reader.read(&mut buffer) {
            if read == 0 {
                break;
            }
            pending.extend_from_slice(&buffer[..read]);
            let complete = split_complete_utf8(&pending);
            let data = String::from_utf8_lossy(&pending[..complete]).into_owned();
            pending.drain(..complete);
            let _ = app.emit(OUTPUT_EVENT, Output { id, data });
        }
        let _ = app.emit(EXIT_EVENT, id);
    });
}

#[cfg(windows)]
fn list_wsl_output() -> Option<Vec<u8>> {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    std::process::Command::new("wsl.exe")
        .args(["-l", "-q"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok()
        .map(|output| output.stdout)
}

#[cfg(not(windows))]
fn list_wsl_output() -> Option<Vec<u8>> {
    None
}

fn wsl_distros() -> Vec<String> {
    list_wsl_output()
        .map(|output| profiles::parse_distros(&output))
        .unwrap_or_default()
}

fn available_profiles(project_folder: Option<&PathBuf>) -> Vec<Profile> {
    let shell_variable = std::env::var("SHELL").ok();
    let folder = project_folder.map(|path| path.to_string_lossy().into_owned());
    profiles::profiles(
        std::env::consts::OS,
        shell_variable.as_deref(),
        folder.as_deref(),
        &wsl_distros(),
    )
}

#[tauri::command]
pub async fn terminal_profiles(workspace: State<'_, Workspace>) -> Result<Vec<Profile>> {
    Ok(available_profiles(workspace.root().as_ref()))
}

#[tauri::command]
pub async fn terminal_open(
    app: AppHandle,
    profile: Option<String>,
    cols: u16,
    rows: u16,
    terminals: State<'_, Terminals>,
    workspace: State<'_, Workspace>,
) -> Result<u32> {
    let root = workspace.root();
    let profiles = available_profiles(root.as_ref());
    let chosen = match profile {
        Some(id) => profiles.into_iter().find(|candidate| candidate.id == id),
        None => profiles.into_iter().next(),
    }
    .ok_or(Error::NoProfile)?;
    let mut command = CommandBuilder::new(&chosen.program);
    command.args(&chosen.args);
    command.env("TERM", "xterm-256color");
    let directory = root
        .filter(|_| chosen.uses_project_folder)
        .or_else(dirs::home_dir);
    if let Some(directory) = directory {
        command.cwd(directory);
    }
    let pair = native_pty_system()
        .openpty(size(cols, rows))
        .map_err(pty_error)?;
    let child = pair.slave.spawn_command(command).map_err(pty_error)?;
    drop(pair.slave);
    let reader = pair.master.try_clone_reader().map_err(pty_error)?;
    let writer = pair.master.take_writer().map_err(pty_error)?;
    let id = terminals.next_id.fetch_add(1, Ordering::Relaxed) + 1;
    terminals.lock().insert(
        id,
        Session {
            master: pair.master,
            writer,
            child,
        },
    );
    forward_output(app, id, reader);
    Ok(id)
}

#[tauri::command]
pub async fn terminal_write(id: u32, data: String, terminals: State<'_, Terminals>) -> Result<()> {
    let mut sessions = terminals.lock();
    let session = sessions.get_mut(&id).ok_or(Error::NoTerminal)?;
    session.writer.write_all(data.as_bytes())?;
    session.writer.flush()?;
    Ok(())
}

#[tauri::command]
pub async fn terminal_resize(
    id: u32,
    cols: u16,
    rows: u16,
    terminals: State<'_, Terminals>,
) -> Result<()> {
    let sessions = terminals.lock();
    let session = sessions.get(&id).ok_or(Error::NoTerminal)?;
    session.master.resize(size(cols, rows)).map_err(pty_error)
}

#[tauri::command]
pub async fn terminal_close(id: u32, terminals: State<'_, Terminals>) -> Result<()> {
    if let Some(mut session) = terminals.lock().remove(&id) {
        let _ = session.child.kill();
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_an_incomplete_utf8_tail_for_the_next_read() {
        let text = "olá";
        let bytes = text.as_bytes();
        assert_eq!(split_complete_utf8(bytes), bytes.len());
        assert_eq!(split_complete_utf8(&bytes[..bytes.len() - 1]), 2);
    }

    #[test]
    fn does_not_hold_back_invalid_bytes() {
        assert_eq!(split_complete_utf8(&[b'a', 0xff, b'b']), 3);
    }

    #[test]
    fn never_asks_for_an_empty_terminal() {
        let empty = size(0, 0);
        assert_eq!((empty.cols, empty.rows), (1, 1));
    }

    #[test]
    fn runs_a_command_in_a_real_pty() {
        let pair = native_pty_system().openpty(size(80, 24)).expect("pty");
        let mut command = if cfg!(windows) {
            let mut command = CommandBuilder::new("cmd.exe");
            command.args(["/C", "echo alchemide"]);
            command
        } else {
            let mut command = CommandBuilder::new("/bin/sh");
            command.args(["-c", "echo alchemide"]);
            command
        };
        command.env("TERM", "dumb");
        let mut child = pair.slave.spawn_command(command).expect("spawn");
        drop(pair.slave);
        let mut reader = pair.master.try_clone_reader().expect("reader");
        let mut writer = pair.master.take_writer().expect("writer");
        let (sender, receiver) = std::sync::mpsc::channel();
        std::thread::spawn(move || {
            let mut output = Vec::new();
            let mut buffer = [0u8; 1024];
            let mut answered_cursor_query = false;
            while let Ok(read) = reader.read(&mut buffer) {
                if read == 0 {
                    break;
                }
                output.extend_from_slice(&buffer[..read]);
                let text = String::from_utf8_lossy(&output);
                if !answered_cursor_query && text.contains("\x1b[6n") {
                    let _ = writer.write_all(b"\x1b[1;1R");
                    let _ = writer.flush();
                    answered_cursor_query = true;
                }
                if text.contains("alchemide") {
                    break;
                }
            }
            let _ = sender.send(String::from_utf8_lossy(&output).into_owned());
        });
        let output = receiver
            .recv_timeout(std::time::Duration::from_secs(20))
            .expect("terminal output within 20 seconds");
        let _ = child.kill();
        assert!(output.contains("alchemide"), "output was {output:?}");
    }
}
