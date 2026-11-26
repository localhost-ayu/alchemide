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
