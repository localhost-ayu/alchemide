export type Environment =
  | { kind: "windows" }
  | { kind: "linux" }
  | { kind: "wsl"; distro: string | null };
