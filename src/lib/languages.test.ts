import { describe, expect, test } from "vitest";
import { languageForPath, languageLabel } from "./languages";

describe("languageForPath", () => {
  test.each([
    ["index.php", "php"],
    ["app.js", "javascript"],
    ["vite.config.mjs", "javascript"],
    ["babel.config.cjs", "javascript"],
    ["main.ts", "typescript"],
    ["Button.jsx", "jsx"],
    ["App.tsx", "tsx"],
    ["schema.sql", "sql"],
    ["README.md", "markdown"],
    ["index.html", "html"],
    ["styles.css", "css"],
    ["package.json", "json"],
    ["main.rs", "rust"],
    ["manage.py", "python"],
    ["stubs.pyi", "python"],
    ["server.go", "go"],
  ])("maps %s to %s", (path, language) => {
    expect(languageForPath(path)).toBe(language);
  });

  test("ignores the case of the extension", () => {
    expect(languageForPath("LEGACY.PHP")).toBe("php");
  });

  test("uses only the file name of full paths on any platform", () => {
    expect(languageForPath("/home/user/project.v2/src/App.tsx")).toBe("tsx");
    expect(languageForPath("C:\\code\\site.d\\index.php")).toBe("php");
  });

  test("falls back to plain text", () => {
    expect(languageForPath("notes.txt")).toBe("plaintext");
    expect(languageForPath("Makefile")).toBe("plaintext");
    expect(languageForPath(".gitignore")).toBe("plaintext");
  });
});

test("labels each language for the status bar", () => {
  expect(languageLabel("tsx")).toBe("TypeScript JSX");
  expect(languageLabel("plaintext")).toBe("Plain Text");
});
