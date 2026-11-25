import type { Environment, Folder } from "./types";

export function getEnvironment(): Promise<Environment> {
  return Promise.resolve({ kind: "linux" });
}

export function openFolder(): Promise<Folder | null> {
  return Promise.resolve({ name: "sample-project", path: "/home/user/sample-project" });
}
