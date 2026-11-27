import { t } from "../../lib/i18n";
import {
  type Corner,
  DEFAULT_EDITOR_BACKDROP,
  type EditorBackdrop,
  type EditorBackdropMode,
  type Effects,
  type Fit,
  type MascotPosition,
  type Theme,
  type ThemeBackground,
  type ThemeMascot,
  type ThemeShape,
  type ThemeSyntax,
  type ThemeUi,
  type UiFont,
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

export const UI_FONTS: readonly UiFont[] = ["system", "rounded", "serif", "mono"];

export const DEFAULT_SHAPE: ThemeShape = { radius: 8, font: "system" };

export const MAX_RADIUS = 16;

function readShape(input: unknown): ThemeShape {
  const shape = isFields(input) ? input : {};
  return {
    radius: Math.round(numberIn(shape.radius, 0, MAX_RADIUS, DEFAULT_SHAPE.radius)),
    font: UI_FONTS.find((font) => font === shape.font) ?? DEFAULT_SHAPE.font,
  };
}

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
    warnings.push(t("theme.warnSyntaxColor", { key }));
    return fallback;
  };
  return { ...required, type: optional("type", ui.accent2), number: optional("number", ui.accent) };
}

const EDITOR_MODES: EditorBackdropMode[] = ["sharp", "layer", "solid"];

export function readEditorBackdrop(value: unknown, warnings: string[]): EditorBackdrop | null {
  if (value === undefined) {
    return null;
  }
  if (!isFields(value)) {
    warnings.push(t("theme.warnEditorBackdrop"));
    return null;
  }
  const mode = EDITOR_MODES.find((candidate) => candidate === value.mode);
  return {
    mode: mode ?? DEFAULT_EDITOR_BACKDROP.mode,
    dim: numberIn(value.dim, 0, 1, DEFAULT_EDITOR_BACKDROP.dim),
    blur: numberIn(value.blur, 0, 40, DEFAULT_EDITOR_BACKDROP.blur),
  };
}

export function readBackground(value: unknown, ui: ThemeUi, warnings: string[]): ThemeBackground {
  const fallback: ThemeBackground = { type: "solid", color: ui.bg };
  if (value === undefined) {
    return fallback;
  }
  if (!isFields(value)) {
    warnings.push(t("theme.warnBackgroundObject"));
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
    const editor = readEditorBackdrop(value.editor, warnings);
    return {
      type: value.type,
      path: value.path,
      fit,
      blur: numberIn(value.blur, 0, 40, 0),
      dim: numberIn(value.dim, 0, 1, 0.5),
      ...(editor ? { editor } : {}),
    };
  }
  warnings.push(t("theme.warnBackgroundInvalid"));
  return fallback;
}

function readMascotPosition(value: unknown): MascotPosition | null {
  if (!isFields(value)) {
    return null;
  }
  const inRange = (n: unknown): n is number =>
    typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;
  return inRange(value.x) && inRange(value.y) ? { x: value.x, y: value.y } : null;
}

export function readMascot(value: unknown, warnings: string[]): ThemeMascot | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (!isFields(value) || !isRelativePath(value.path)) {
    warnings.push(t("theme.warnMascot"));
    return null;
  }
  const corner = CORNERS.find((candidate) => candidate === value.corner) ?? "bottom-right";
  const layer = value.layer === "front" || value.layer === "behind" ? value.layer : null;
  const position = readMascotPosition(value.position);
  return {
    path: value.path,
    corner,
    opacity: numberIn(value.opacity, 0, 1, 0.35),
    size: numberIn(value.size, 32, 1024, 280),
    ...(layer ? { layer } : {}),
    ...(position ? { position } : {}),
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
    return reject(t("theme.notObject"));
  }
  if (typeof input.name !== "string" || input.name.trim() === "") {
    return reject(t("theme.noName"));
  }
  const ui = readColors(input.ui, UI_KEYS);
  if (!ui) {
    return reject(t("theme.uiColors", { name: String(input.name), keys: UI_KEYS.join(", ") }));
  }
  const warnings: string[] = [];
  const syntax = isFields(input.syntax) ? readSyntax(input.syntax, ui, warnings) : null;
  if (!syntax) {
    return reject(
      t("theme.syntaxColors", { name: String(input.name), keys: SYNTAX_KEYS.join(", ") }),
    );
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
      shape: readShape(input.shape),
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
