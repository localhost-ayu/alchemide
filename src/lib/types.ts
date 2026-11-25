export type Environment =
  | { kind: "windows" }
  | { kind: "linux" }
  | { kind: "wsl"; distro: string | null };

export type Folder = {
  name: string;
  path: string;
};
