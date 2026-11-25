import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Entry, Environment, Folder } from "./types";

export function getEnvironment(): Promise<Environment> {
  return invoke<Environment>("get_environment");
}

export function openFolder(): Promise<Folder | null> {
  return invoke<Folder | null>("open_folder");
}

export function listDir(path: string): Promise<Entry[]> {
  return invoke<Entry[]>("list_dir", { path });
}

export function onFsChange(handler: (dirs: string[]) => void): Promise<() => void> {
  return listen<string[]>("fs-changed", (event) => handler(event.payload));
}
