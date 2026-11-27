# 0009. Docker panel through the docker CLI

- Status: accepted
- Date: 2026-11-26

## Context

Checking whether a project's containers are up, and starting or stopping them, meant opening
Docker Desktop. The panel only needs the container list and three actions.

## Decision

- Rust runs the `docker` command line (`docker ps --all --no-trunc --format ...`, `docker start`,
  `docker stop`, `docker restart`) with arguments passed directly, never through a shell, and
  with no console window on Windows. The format is a tab-separated template, so the parser does
  not depend on Docker's JSON fields.
- The actions accept only a container id made of hex digits (up to 64) and one of three verbs, so
  nothing typed into the webview reaches the command line as an option.
- No Docker SDK crate and no talking to the Docker socket or named pipe directly: the CLI already
  knows the user's context (Docker Desktop, WSL, remote contexts) and adds no dependency.
- Logs go to a normal terminal tab that runs `docker logs --follow`. The docker feature does not
  import the terminal feature: it sends a request through `src/lib/terminalRequests.ts`, which the
  terminal panel listens to.
- The list refreshes every 5 seconds only while the panel is visible. Docker events
  (`docker events`) would be more precise but need a long-running process to manage; polling is
  enough for a list of a few dozen containers.
- A missing `docker` command or a stopped daemon is shown as a short notice in the panel, not as
  an error popup.

## Consequences

- The panel works wherever the `docker` command works, including Podman's `docker` alias.
- Each refresh starts a process (~50 ms); acceptable at one every 5 seconds while visible.
- Images, volumes and Compose actions (`up`/`down`) are not covered yet.
