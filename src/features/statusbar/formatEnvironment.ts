import type { Environment } from "../../lib/types";

export function formatEnvironment(environment: Environment): string {
  switch (environment.kind) {
    case "windows":
      return "Windows";
    case "linux":
      return "Linux";
    case "wsl":
      return environment.distro ? `WSL · ${environment.distro}` : "WSL";
  }
}
