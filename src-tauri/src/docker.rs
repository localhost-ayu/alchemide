use std::io::ErrorKind;
use std::process::{Command, Output};

use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};

const FORMAT: &str =
    "{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.State}}\t{{.Status}}\t{{.Ports}}\t{{.Label \"com.docker.compose.project\"}}";

#[derive(Debug, Serialize, PartialEq, Eq, Clone)]
pub struct Container {
    pub id: String,
    pub name: String,
    pub image: String,
    pub state: String,
    pub status: String,
    pub ports: String,
    pub project: Option<String>,
}

#[derive(Debug, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ContainerAction {
    Start,
    Stop,
    Restart,
}

impl ContainerAction {
    fn verb(self) -> &'static str {
        match self {
            ContainerAction::Start => "start",
            ContainerAction::Stop => "stop",
            ContainerAction::Restart => "restart",
        }
    }
}

pub fn parse_containers(output: &str) -> Vec<Container> {
    output
        .lines()
        .filter_map(|line| {
            let fields: Vec<&str> = line.trim_end_matches('\r').split('\t').collect();
            let [id, name, image, state, status, ports, project] = fields.as_slice() else {
                return None;
            };
            Some(Container {
                id: (*id).into(),
                name: (*name).into(),
                image: (*image).into(),
                state: (*state).into(),
                status: (*status).into(),
                ports: (*ports).into(),
                project: Some(project.trim())
                    .filter(|project| !project.is_empty())
                    .map(String::from),
            })
        })
        .collect()
}

pub fn is_container_id(id: &str) -> bool {
    (1..=64).contains(&id.len()) && id.chars().all(|c| c.is_ascii_hexdigit())
}

fn first_line(text: &[u8]) -> String {
    String::from_utf8_lossy(text)
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .unwrap_or("Docker did not answer")
        .to_string()
}

fn run(args: &[&str]) -> Result<Output> {
    let mut command = Command::new("docker");
    command.args(args);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    let output = command.output().map_err(|error| match error.kind() {
        ErrorKind::NotFound => Error::DockerMissing,
        _ => Error::Docker(error.to_string()),
    })?;
    if output.status.success() {
        Ok(output)
    } else {
        Err(Error::Docker(first_line(&output.stderr)))
    }
}

async fn run_blocking(args: Vec<String>) -> Result<Output> {
    tauri::async_runtime::spawn_blocking(move || {
        let args: Vec<&str> = args.iter().map(String::as_str).collect();
        run(&args)
    })
    .await
    .map_err(|error| Error::Docker(error.to_string()))?
}

#[tauri::command]
pub async fn docker_containers() -> Result<Vec<Container>> {
    let output = run_blocking(
        ["ps", "--all", "--no-trunc", "--format", FORMAT]
            .map(String::from)
            .to_vec(),
    )
    .await?;
    Ok(parse_containers(&String::from_utf8_lossy(&output.stdout)))
}

#[tauri::command]
pub async fn docker_action(id: String, action: ContainerAction) -> Result<()> {
    if !is_container_id(&id) {
        return Err(Error::Docker("invalid container id".into()));
    }
    run_blocking(vec![action.verb().into(), id]).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_tab_separated_rows() {
        let output =
            "abc123\tshop-db-1\tmysql:8.4\trunning\tUp 2 hours\t0.0.0.0:3306->3306/tcp\tshop\r\n\
                      def456\tscratch\talpine\texited\tExited (0) 5 days ago\t\t\n\
                      broken line\n";
        let containers = parse_containers(output);

        assert_eq!(containers.len(), 2);
        assert_eq!(
            containers[0],
            Container {
                id: "abc123".into(),
                name: "shop-db-1".into(),
                image: "mysql:8.4".into(),
                state: "running".into(),
                status: "Up 2 hours".into(),
                ports: "0.0.0.0:3306->3306/tcp".into(),
                project: Some("shop".into()),
            }
        );
        assert_eq!(containers[1].project, None);
        assert_eq!(containers[1].ports, "");
    }

    #[test]
    fn accepts_only_hex_container_ids() {
        assert!(is_container_id("49cf015398a5"));
        assert!(is_container_id(&"a".repeat(64)));
        assert!(!is_container_id(""));
        assert!(!is_container_id(&"a".repeat(65)));
        assert!(!is_container_id("abc; rm -rf /"));
        assert!(!is_container_id("--help"));
    }

    #[test]
    fn reads_the_first_meaningful_error_line() {
        assert_eq!(
            first_line(b"\n  error during connect: pipe not found\nmore"),
            "error during connect: pipe not found"
        );
        assert_eq!(first_line(b""), "Docker did not answer");
    }
}
