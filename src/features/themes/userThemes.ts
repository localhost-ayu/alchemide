import type { UserThemeFile } from "../../lib/types";
import { readTheme } from "./parseTheme";
import type { Theme } from "./theme";

export type UserTheme = {
  file: string;
  theme: Theme;
};

export type LoadedUserThemes = {
  themes: UserTheme[];
  warnings: string[];
};

export function nameKey(name: string): string {
  return name.trim().toLocaleLowerCase();
}

export function readUserThemes(files: UserThemeFile[], builtin: Theme[]): LoadedUserThemes {
  const taken = new Set(builtin.map((theme) => nameKey(theme.name)));
  const themes: UserTheme[] = [];
  const warnings: string[] = [];
  for (const { file, theme: source } of files) {
    const { theme, warnings: found } = readTheme(source);
    const prefixed = found.map((warning) => `${file}: ${warning}`);
    if (!theme) {
      warnings.push(...prefixed.map((warning) => `${warning}; skipped`));
      continue;
    }
    if (taken.has(nameKey(theme.name))) {
      warnings.push(`${file}: the name "${theme.name}" is already in use; skipped`);
      continue;
    }
    taken.add(nameKey(theme.name));
    themes.push({ file, theme });
    warnings.push(...prefixed);
  }
  return { themes, warnings };
}

export function uniqueName(name: string, taken: string[]): string {
  const used = new Set(taken.map(nameKey));
  const base = name.trim();
  if (!used.has(nameKey(base))) {
    return base;
  }
  let counter = 2;
  while (used.has(nameKey(`${base} ${counter}`))) {
    counter += 1;
  }
  return `${base} ${counter}`;
}

export function nameProblem(name: string, taken: string[]): string | null {
  if (name.trim() === "") {
    return "Give the theme a name";
  }
  if (taken.some((other) => nameKey(other) === nameKey(name))) {
    return "Another theme already has this name";
  }
  return null;
}
