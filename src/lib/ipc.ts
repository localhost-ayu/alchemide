import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type {
  AssetKind,
  Entry,
  Environment,
  FileContent,
  Folder,
  ProjectFile,
  ReplaceSummary,
  ReplaceTarget,
  SearchBatch,
  SearchDone,
  SearchQuery,
  Settings,
  TerminalOutput,
  TerminalProfile,
  UpdateInfo,
} from "./types";

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

export function listFiles(): Promise<ProjectFile[]> {
  return invoke<ProjectFile[]>("list_files");
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

export function loadSettings(): Promise<Settings> {
  return invoke<Settings>("load_settings");
}

export function saveSettings(settings: Settings): Promise<void> {
  return invoke<void>("save_settings", { settings });
}

export function importAsset(kind: AssetKind): Promise<string | null> {
  return invoke<string | null>("import_asset", { kind });
}

export async function assetUrl(relative: string): Promise<string> {
  return convertFileSrc(await invoke<string>("asset_path", { relative }));
}

export function terminalProfiles(): Promise<TerminalProfile[]> {
  return invoke<TerminalProfile[]>("terminal_profiles");
}

export function terminalOpen(profile: string | null, cols: number, rows: number): Promise<number> {
  return invoke<number>("terminal_open", { profile, cols, rows });
}

export function terminalWrite(id: number, data: string): Promise<void> {
  return invoke<void>("terminal_write", { id, data });
}

export function terminalResize(id: number, cols: number, rows: number): Promise<void> {
  return invoke<void>("terminal_resize", { id, cols, rows });
}

export function terminalClose(id: number): Promise<void> {
  return invoke<void>("terminal_close", { id });
}

export function onTerminalOutput(handler: (output: TerminalOutput) => void): Promise<() => void> {
  return listen<TerminalOutput>("terminal-output", (event) => handler(event.payload));
}

export function onTerminalExit(handler: (id: number) => void): Promise<() => void> {
  return listen<number>("terminal-exit", (event) => handler(event.payload));
}

export function openExternal(url: string): Promise<void> {
  return invoke<void>("open_external", { url });
}

export function onWorkspaceChange(handler: (folder: Folder) => void): Promise<() => void> {
  return listen<Folder>("workspace-changed", (event) => handler(event.payload));
}

export function searchStart(id: number, query: SearchQuery): Promise<void> {
  return invoke<void>("search_start", { id, query });
}

export function onSearchResults(handler: (batch: SearchBatch) => void): Promise<() => void> {
  return listen<SearchBatch>("search-results", (event) => handler(event.payload));
}

export function onSearchDone(handler: (done: SearchDone) => void): Promise<() => void> {
  return listen<SearchDone>("search-done", (event) => handler(event.payload));
}

export function replaceMatches(
  query: SearchQuery,
  replacement: string,
  targets: ReplaceTarget[],
): Promise<ReplaceSummary> {
  return invoke<ReplaceSummary>("replace_matches", { query, replacement, targets });
}

export function checkUpdate(): Promise<UpdateInfo | null> {
  return invoke<UpdateInfo | null>("check_update");
}

export function installUpdate(): Promise<void> {
  return invoke<void>("install_update");
}
