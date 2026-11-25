import { invoke } from "@tauri-apps/api/core";
import type { Environment } from "./types";

export function getEnvironment(): Promise<Environment> {
  return invoke<Environment>("get_environment");
}
