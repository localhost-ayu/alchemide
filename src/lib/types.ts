export type Environment =
  | { kind: "windows" }
  | { kind: "linux" }
  | { kind: "wsl"; distro: string | null };

export type Folder = {
  name: string;
  path: string;
};

export type Entry = {
  name: string;
  path: string;
  isDir: boolean;
};

export type FileContent = {
  text: string;
  hasBom: boolean;
};

export type Settings = Record<string, unknown>;

export type AssetKind = "background" | "mascot";

export type TerminalOutput = {
  id: number;
  data: string;
};

export type TerminalProfile = {
  id: string;
  label: string;
};

export type ProjectFile = {
  path: string;
  relative: string;
};

export type SearchQuery = {
  text: string;
  regex: boolean;
  caseSensitive: boolean;
};

export type SearchMatch = {
  path: string;
  relative: string;
  line: number;
  preview: string;
  ranges: [number, number][];
};

export type SearchBatch = {
  id: number;
  matches: SearchMatch[];
};

export type SearchDone = {
  id: number;
  total: number;
  truncated: boolean;
};

export type ReplaceTarget = {
  path: string;
  lines: number[];
};

export type ReplaceSummary = {
  files: number;
  replacements: number;
};

export type LspStart =
  | { kind: "ready"; id: number; root: string; name: string }
  | { kind: "missing"; name: string; install: string }
  | { kind: "unsupported" };

export type LspMessage = {
  id: number;
  message: string;
};

export type UserThemeFile = {
  file: string;
  theme: unknown;
};

export type VscodeTheme = {
  label: string;
  extension: string;
  path: string;
  dark: boolean;
};

export type UpdateInfo = {
  version: string;
  notes: string | null;
};
