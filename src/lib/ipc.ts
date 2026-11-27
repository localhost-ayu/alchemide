import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type {
  AssetKind,
  Blame,
  Branch,
  Commit,
  ContainerAction,
  DockerContainer,
  Entry,
  Environment,
  FileContent,
  Folder,
  GitStatus,
  LspMessage,
  LspStart,
  ProjectFile,
  ReplaceSummary,
  ReplaceTarget,
  SearchBatch,
  SearchDone,
  SearchQuery,
  Settings,
  SnippetFile,
  SnippetImport,
  TerminalOutput,
  TerminalProfile,
  UpdateInfo,
  UserThemeFile,
  VscodeTheme,
} from "./types";

export function getEnvironment(): Promise<Environment> {
  return invoke<Environment>("get_environment");
}

export function openFolder(): Promise<Folder | null> {
  return invoke<Folder | null>("open_folder");
}

export function reopenLastFolder(): Promise<Folder | null> {
  return invoke<Folder | null>("reopen_last_folder");
}

export function pickFile(): Promise<string | null> {
  return invoke<string | null>("pick_file");
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

export function listUserSnippets(): Promise<SnippetFile[]> {
  return invoke<SnippetFile[]>("list_user_snippets");
}

export function importVscodeSnippets(): Promise<SnippetImport> {
  return invoke<SnippetImport>("import_vscode_snippets");
}

export function setZoom(scale: number): Promise<void> {
  return invoke<void>("set_zoom", { scale });
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

export function lspStart(language: string): Promise<LspStart> {
  return invoke<LspStart>("lsp_start", { language });
}

export function lspSend(id: number, message: string): Promise<void> {
  return invoke<void>("lsp_send", { id, message });
}

export function lspStop(id: number): Promise<void> {
  return invoke<void>("lsp_stop", { id });
}

export function onLspMessage(handler: (message: LspMessage) => void): Promise<() => void> {
  return listen<LspMessage>("lsp-message", (event) => handler(event.payload));
}

export function onLspExit(handler: (id: number) => void): Promise<() => void> {
  return listen<number>("lsp-exit", (event) => handler(event.payload));
}

export function listUserThemes(): Promise<UserThemeFile[]> {
  return invoke<UserThemeFile[]>("list_user_themes");
}

export function saveUserTheme(file: string | null, theme: unknown): Promise<string> {
  return invoke<string>("save_user_theme", { file, theme });
}

export function deleteUserTheme(file: string): Promise<void> {
  return invoke<void>("delete_user_theme", { file });
}

export function importTheme(): Promise<unknown | null> {
  return invoke<unknown | null>("import_theme");
}

export function exportTheme(theme: unknown): Promise<boolean> {
  return invoke<boolean>("export_theme", { theme });
}

export function listVscodeThemes(): Promise<VscodeTheme[]> {
  return invoke<VscodeTheme[]>("list_vscode_themes");
}

export function loadVscodeTheme(path: string): Promise<unknown> {
  return invoke<unknown>("load_vscode_theme", { path });
}

export function pickVscodeTheme(): Promise<unknown | null> {
  return invoke<unknown | null>("pick_vscode_theme");
}

export function checkUpdate(): Promise<UpdateInfo | null> {
  return invoke<UpdateInfo | null>("check_update");
}

export function installUpdate(): Promise<void> {
  return invoke<void>("install_update");
}

export function dockerContainers(): Promise<DockerContainer[]> {
  return invoke<DockerContainer[]>("docker_containers");
}

export function dockerAction(id: string, action: ContainerAction): Promise<void> {
  return invoke<void>("docker_action", { id, action });
}

export function gitStatus(): Promise<GitStatus> {
  return invoke<GitStatus>("git_status");
}

export function gitDiff(path: string, staged: boolean, untracked: boolean): Promise<string> {
  return invoke<string>("git_diff", { path, staged, untracked });
}

export function gitStage(paths: string[]): Promise<void> {
  return invoke<void>("git_stage", { paths });
}

export function gitStageAll(): Promise<void> {
  return invoke<void>("git_stage_all");
}

export function gitUnstage(paths: string[]): Promise<void> {
  return invoke<void>("git_unstage", { paths });
}

export function gitCommit(message: string): Promise<string> {
  return invoke<string>("git_commit", { message });
}

export function gitLog(): Promise<Commit[]> {
  return invoke<Commit[]>("git_log");
}

export function gitShow(hash: string): Promise<string> {
  return invoke<string>("git_show", { hash });
}

export function gitBlame(path: string): Promise<Blame> {
  return invoke<Blame>("git_blame", { path });
}

export function gitBranches(): Promise<Branch[]> {
  return invoke<Branch[]>("git_branches");
}

export function gitSwitch(branch: string): Promise<void> {
  return invoke<void>("git_switch", { branch });
}

export function createEntry(parent: string, name: string, isDir: boolean): Promise<string> {
  return invoke<string>("create_entry", { parent, name, isDir });
}

export function renameEntry(path: string, newName: string): Promise<string> {
  return invoke<string>("rename_entry", { path, newName });
}

export function deleteEntry(path: string): Promise<void> {
  return invoke<void>("delete_entry", { path });
}
