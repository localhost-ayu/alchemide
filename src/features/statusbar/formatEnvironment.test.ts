import { describe, expect, test } from "vitest";
import { formatEnvironment } from "./formatEnvironment";

describe("formatEnvironment", () => {
  test("names Windows and Linux", () => {
    expect(formatEnvironment({ kind: "windows" })).toBe("Windows");
    expect(formatEnvironment({ kind: "linux" })).toBe("Linux");
  });

  test("adds the distro to WSL when known", () => {
    expect(formatEnvironment({ kind: "wsl", distro: "Ubuntu" })).toBe("WSL · Ubuntu");
  });

  test("shows plain WSL when the distro is unknown", () => {
    expect(formatEnvironment({ kind: "wsl", distro: null })).toBe("WSL");
  });
});
