use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::error::{Error, Result};
use crate::fs::Workspace;

mod framing;
mod servers;

use servers::ServerSpec;

pub const MESSAGE_EVENT: &str = "lsp-message";
pub const EXIT_EVENT: &str = "lsp-exit";

struct Server {
    key: &'static str,
    root: PathBuf,
    child: Child,
    stdin: ChildStdin,
}

type ServerMap = Arc<Mutex<HashMap<u32, Server>>>;

#[derive(Default)]
pub struct LanguageServers {
    servers: ServerMap,
    next_id: AtomicU32,
}

fn lock(servers: &ServerMap) -> MutexGuard<'_, HashMap<u32, Server>> {
    servers
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

#[derive(Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum LspStart {
    #[serde(rename_all = "camelCase")]
    Ready {
        id: u32,
        root: String,
        name: &'static str,
    },
    #[serde(rename_all = "camelCase")]
    Missing {
        name: &'static str,
        install: &'static str,
    },
    Unsupported,
}

#[derive(Clone, Serialize)]
struct Message {
    id: u32,
    message: String,
}

fn locate(spec: &ServerSpec) -> Option<PathBuf> {
    let path = std::env::var("PATH").ok();
    let pathext = std::env::var("PATHEXT").ok();
    let extensions = servers::program_extensions(std::env::consts::OS, pathext.as_deref());
    let extensions: Vec<&str> = extensions.iter().map(String::as_str).collect();
    servers::find_program(spec.program, path.as_deref(), &extensions, Path::is_file)
}

#[cfg(windows)]
fn hide_window(command: &mut Command) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    command.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(windows))]
fn hide_window(_command: &mut Command) {}

fn spawn(program: &Path, spec: &ServerSpec, root: &Path) -> Result<Child> {
    let mut command = Command::new(program);
    command
        .args(spec.args)
        .current_dir(root)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    hide_window(&mut command);
    command
        .spawn()
        .map_err(|error| Error::LanguageServer(error.to_string()))
}

fn forward_messages(app: AppHandle, servers: ServerMap, id: u32, mut stdout: ChildStdout) {
    std::thread::spawn(move || {
        let mut decoder = framing::Decoder::default();
        let mut buffer = [0u8; 16384];
        while let Ok(read) = stdout.read(&mut buffer) {
            if read == 0 {
                break;
            }
            for message in decoder.push(&buffer[..read]) {
                let _ = app.emit(MESSAGE_EVENT, Message { id, message });
            }
        }
        if let Some(mut server) = lock(&servers).remove(&id) {
            let _ = server.child.wait();
        }
        let _ = app.emit(EXIT_EVENT, id);
    });
}

fn ready(id: u32, root: &Path, spec: &ServerSpec) -> LspStart {
    LspStart::Ready {
        id,
        root: root.to_string_lossy().into_owned(),
        name: spec.name,
    }
}

#[tauri::command]
pub async fn lsp_start(
    app: AppHandle,
    language: String,
    servers: State<'_, LanguageServers>,
    workspace: State<'_, Workspace>,
) -> Result<LspStart> {
    let Some(spec) = servers::server_for(&language) else {
        return Ok(LspStart::Unsupported);
    };
    let root = workspace.root().ok_or(Error::NoWorkspace)?;
    let running = lock(&servers.servers)
        .iter()
        .find(|(_, server)| server.key == spec.key && server.root == root)
        .map(|(id, _)| *id);
    if let Some(id) = running {
        return Ok(ready(id, &root, &spec));
    }
    let Some(program) = locate(&spec) else {
        return Ok(LspStart::Missing {
            name: spec.name,
            install: spec.install,
        });
    };
    let mut child = spawn(&program, &spec, &root)?;
    let (Some(stdin), Some(stdout)) = (child.stdin.take(), child.stdout.take()) else {
        let _ = child.kill();
        return Err(Error::LanguageServer("no pipes to the server".into()));
    };
    let id = servers.next_id.fetch_add(1, Ordering::Relaxed);
    lock(&servers.servers).insert(
        id,
        Server {
            key: spec.key,
            root: root.clone(),
            child,
            stdin,
        },
    );
    forward_messages(app, servers.servers.clone(), id, stdout);
    Ok(ready(id, &root, &spec))
}

#[tauri::command]
pub async fn lsp_send(id: u32, message: String, servers: State<'_, LanguageServers>) -> Result<()> {
    let mut map = lock(&servers.servers);
    let server = map.get_mut(&id).ok_or(Error::NoLanguageServerSession)?;
    server.stdin.write_all(&framing::encode(&message))?;
    server.stdin.flush()?;
    Ok(())
}

#[tauri::command]
pub async fn lsp_stop(id: u32, servers: State<'_, LanguageServers>) -> Result<()> {
    let removed = lock(&servers.servers).remove(&id);
    if let Some(mut server) = removed {
        let _ = server.child.kill();
        let _ = server.child.wait();
    }
    Ok(())
}
