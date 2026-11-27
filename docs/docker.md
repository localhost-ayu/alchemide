# Docker panel

`Ctrl+Shift+D` (or "Show Docker containers" in the command palette) opens the Docker panel in the
side bar. It lists every container on the machine in two groups, running and stopped, sorted by
Compose project and then by name.

| Action | What it does                                                                                   |
| ------ | ---------------------------------------------------------------------------------------------- |
| ▶ / ■  | `docker start` / `docker stop`                                                                 |
| ↻      | `docker restart` (running containers only)                                                     |
| ≡      | Opens a terminal tab and runs `docker logs --follow --tail 200 <id>`; `Ctrl+C` stops following |

The list refreshes every 5 seconds while the panel is visible, after each action and with the ↻
button at the top. Nothing is asked of Docker while the panel is hidden.

If the `docker` command is not installed, or Docker Desktop or the Docker service is not running,
the panel shows a one-line notice instead of the list. Start Docker and press refresh.

See [decision 0009](decisions/0009-docker-panel.md).
