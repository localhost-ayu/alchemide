import catalisador from "./builtin/catalisador.json";
import { FALLBACK_THEME } from "./fallbackTheme";
import { parseTheme } from "./parseTheme";
import type { Theme } from "./theme";

const sources: unknown[] = [catalisador];

export const BUILTIN_THEMES: Theme[] = sources.map(
  (source) => parseTheme(source, FALLBACK_THEME).theme,
);

export const DEFAULT_THEME = BUILTIN_THEMES[0] ?? FALLBACK_THEME;
