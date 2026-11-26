import aco from "./builtin/aco.json";
import catalisador from "./builtin/catalisador.json";
import cobre from "./builtin/cobre.json";
import ferrugem from "./builtin/ferrugem.json";
import lavanda from "./builtin/lavanda.json";
import mare from "./builtin/mare.json";
import menta from "./builtin/menta.json";
import musgo from "./builtin/musgo.json";
import pessego from "./builtin/pessego.json";
import { FALLBACK_THEME } from "./fallbackTheme";
import { parseTheme } from "./parseTheme";
import type { Theme } from "./theme";

export const BUILTIN_SOURCES: unknown[] = [
  catalisador,
  ferrugem,
  cobre,
  aco,
  mare,
  musgo,
  lavanda,
  menta,
  pessego,
];

export const BUILTIN_THEMES: Theme[] = BUILTIN_SOURCES.map(
  (source) => parseTheme(source, FALLBACK_THEME).theme,
);

export const DEFAULT_THEME = BUILTIN_THEMES[0] ?? FALLBACK_THEME;
