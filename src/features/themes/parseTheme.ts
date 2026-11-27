import type {
  Corner,
  Effects,
  Fit,
  Theme,
  ThemeBackground,
  ThemeMascot,
  ThemeSyntax,
  ThemeUi,
} from "./theme";

export type ParsedTheme = {
  theme: Theme;
  warnings: string[];
};

type Fields = Record<string, unknown>;

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const GRADIENT = /^(?:repeating-)?(?:linear|radial|conic)-gradient\([^;{}]*\)$/i;
const UI_KEYS = ["bg", "panel", "accent", "accent2", "text"] as const;
const SYNTAX_KEYS = ["keyword", "string", "function", "comment", "variable"] as const;
const CORNERS: readonly Corner[] = ["top-left", "top-right", "bottom-left", "bottom-right"];

export const DEFAULT_EFFECTS: Effects = {
  surface: "glass",
  background: true,
  mascot: true,
  animations: true,
};

function isFields(value: unknown): value is Fields {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

function numberIn(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && value >= min && value <= max ? value : fallback;
}

function isRelativePath(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }
  const parts = value.split(/[\\/]/);
  return !/^(?:[\\/]|[a-z]:)/i.test(value) && !parts.includes("..");
}

function readColors<K extends string>(
  section: unknown,
  keys: readonly K[],
): Record<K, string> | null {
  if (!isFields(section) || !keys.every((key) => isColor(section[key]))) {
    return null;
  }
  return Object.fromEntries(keys.map((key) => [key, section[key]])) as Record<K, string>;
}

function readSyntax(section: Fields, ui: ThemeUi, warnings: string[]): ThemeSyntax | null {
  const required = readColors(section, SYNTAX_KEYS);
  if (!required) {
    return null;
  }
  const optional = (key: "type" | "number", fallback: string) => {
    if (section[key] === undefined) {
      return fallback;
    }
    if (isColor(section[key])) {
      return section[key];
    }
    warnings.push(`syntax.${key} is not a hex color; using a default`);
    return fallback;
  };
  return { ...required, type: optional("type", ui.accent2), number: optional("number", ui.accent) };
}

export function readBackground(value: unknown, ui: ThemeUi, warnings: string[]): ThemeBackground {
  const fallback: ThemeBackground = { type: "solid", color: ui.bg };
  if (value === undefined) {
    return fallback;
  }
  if (!isFields(value)) {
    warnings.push("background is not an object; using a solid background");
    return fallback;
  }
  if (value.type === "solid" && isColor(value.color)) {
    return { type: "solid", color: value.color };
  }
  if (value.type === "gradient" && typeof value.css === "string" && GRADIENT.test(value.css)) {
    if (!/url\(/i.test(value.css)) {
      return { type: "gradient", css: value.css };
    }
  }
  if ((value.type === "image" || value.type === "video") && isRelativePath(value.path)) {
    const fit: Fit = value.fit === "contain" ? "contain" : "cover";
    return {
      type: value.type,
      path: value.path,
      fit,
      blur: numberIn(value.blur, 0, 40, 0),
      dim: numberIn(value.dim, 0, 1, 0.5),
    };
  }
  warnings.push("background is invalid; using a solid background");
  return fallback;
}

export function readMascot(value: unknown, warnings: string[]): ThemeMascot | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (!isFields(value) || !isRelativePath(value.path)) {
    warnings.push("mascot is invalid; hiding it");
    return null;
  }
  const corner = CORNERS.find((candidate) => candidate === value.corner) ?? "bottom-right";
  return {
    path: value.path,
    corner,
    opacity: numberIn(value.opacity, 0, 1, 0.35),
    size: numberIn(value.size, 32, 1024, 280),
  };
}

export function readEffects(value: unknown): Effects {
  if (!isFields(value)) {
    return DEFAULT_EFFECTS;
  }
  const flag = (key: "background" | "mascot" | "animations") =>
    typeof value[key] === "boolean" ? value[key] : DEFAULT_EFFECTS[key];
  return {
    surface: value.surface === "solid" ? "solid" : "glass",
    background: flag("background"),
    mascot: flag("mascot"),
    animations: flag("animations"),
  };
}

export type ReadTheme = {
  theme: Theme | null;
  warnings: string[];
};

export function readTheme(input: unknown): ReadTheme {
  const reject = (reason: string): ReadTheme => ({ theme: null, warnings: [reason] });
  if (!isFields(input)) {
    return reject("the theme is not a JSON object");
  }
  if (typeof input.name !== "string" || input.name.trim() === "") {
    return reject("the theme has no name");
  }
  const ui = readColors(input.ui, UI_KEYS);
  if (!ui) {
    return reject(`${input.name}: ui needs hex colors for ${UI_KEYS.join(", ")}`);
  }
  const warnings: string[] = [];
  const syntax = isFields(input.syntax) ? readSyntax(input.syntax, ui, warnings) : null;
  if (!syntax) {
    return reject(`${input.name}: syntax needs hex colors for ${SYNTAX_KEYS.join(", ")}`);
  }
  const glass = isFields(input.glass) ? input.glass : {};
  return {
    theme: {
      name: input.name,
      mood: typeof input.mood === "string" ? input.mood : "",
      ui,
      syntax,
      background: readBackground(input.background, ui, warnings),
      glass: {
        panelOpacity: numberIn(glass.panelOpacity, 0.2, 1, 0.78),
        blur: numberIn(glass.blur, 0, 40, 12),
      },
      mascot: readMascot(input.mascot, warnings),
      effects: readEffects(input.effects),
    },
    warnings,
  };
}

export function parseTheme(input: unknown, fallback: Theme): ParsedTheme {
  const { theme, warnings } = readTheme(input);
  if (!theme) {
    return {
      theme: fallback,
      warnings: warnings.map((reason) => `${reason}; using ${fallback.name}`),
    };
  }
  return { theme, warnings };
}
