import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Entry, Environment, FileContent, Folder } from "./types";

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

export function readFile(path: string): Promise<FileContent> {
  return invoke<FileContent>("read_file", { path });
}

export function writeFile(path: string, text: string, hasBom: boolean): Promise<void> {
  return invoke<void>("write_file", { path, text, hasBom });
}

export function onCloseRequested(canClose: () => boolean): Promise<() => void> {
  return getCurrentWindow().onCloseRequested((event) => {
    if (!canClose()) {
      event.preventDefault();
    }
  });
}
