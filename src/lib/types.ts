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

export type UpdateInfo = {
  version: string;
  notes: string | null;
};

export type DockerContainer = {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports: string;
  project: string | null;
};

export type ContainerAction = "start" | "stop" | "restart";
