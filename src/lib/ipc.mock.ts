import type { Environment } from "./types";

export function getEnvironment(): Promise<Environment> {
  return Promise.resolve({ kind: "linux" });
}
