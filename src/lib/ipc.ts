import { invoke } from "@tauri-apps/api/core";
import type { Environment, Folder } from "./types";

export function getEnvironment(): Promise<Environment> {
  return invoke<Environment>("get_environment");
}

export function openFolder(): Promise<Folder | null> {
  return invoke<Folder | null>("open_folder");
}
