import type { ThemeSyntax, ThemeUi } from "./theme";

type Rule = { scopes: string[]; foreground: string };

const OPAQUE_HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const ALPHA_HEX = /^#(?:[0-9a-f]{4}|[0-9a-f]{8})$/i;

const SYNTAX_SCOPES: Record<keyof ThemeSyntax, string[]> = {
  keyword: ["keyword.control", "keyword", "storage.type"],
  string: ["string.quoted", "string"],
  function: ["entity.name.function", "support.function", "meta.function-call"],
  comment: ["comment.line", "comment"],
  variable: ["variable.other.readwrite", "variable.other", "variable"],
  type: ["entity.name.type", "support.type", "entity.name.class", "support.class"],
  number: ["constant.numeric", "constant.language", "constant"],
};

function opaque(color: unknown): string | null {
  if (typeof color !== "string") {
    return null;
  }
  if (OPAQUE_HEX.test(color)) {
    return color;
  }
  if (ALPHA_HEX.test(color)) {
    return color.length === 5 ? color.slice(0, 4) : color.slice(0, 7);
  }
  return null;
}

function readRules(tokenColors: unknown): Rule[] {
  if (!Array.isArray(tokenColors)) {
    return [];
  }
  return tokenColors.flatMap((entry): Rule[] => {
    const settings = (entry as { settings?: { foreground?: unknown } } | null)?.settings;
    const foreground = opaque(settings?.foreground);
    if (!foreground) {
      return [];
    }
    const scope = (entry as { scope?: unknown }).scope;
    const scopes =
      typeof scope === "string"
        ? scope.split(",")
        : Array.isArray(scope)
          ? scope.filter((item): item is string => typeof item === "string")
          : [];
    return [{ scopes: scopes.map((item) => item.trim()).filter(Boolean), foreground }];
  });
}

function selectorScore(selector: string, scope: string): number {
  const last = selector.split(/\s+/).pop() ?? "";
  if (last !== scope && !scope.startsWith(`${last}.`)) {
    return 0;
  }
  const depth = last.split(".").length;
  return selector.includes(" ") ? depth - 0.5 : depth;
}

export function colorForScope(rules: Rule[], scope: string): string | null {
  let best: { score: number; color: string } | null = null;
  for (const rule of rules) {
    for (const selector of rule.scopes) {
      const score = selectorScore(selector, scope);
      if (score > 0 && (!best || score >= best.score)) {
        best = { score, color: rule.foreground };
      }
    }
  }
  return best?.color ?? null;
}

function firstColor(colors: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const color = opaque(colors[key]);
    if (color) {
      return color;
    }
  }
  return null;
}

export function isDarkTheme(raw: Record<string, unknown>, background: string): boolean {
  if (raw.type === "light" || raw.type === "hcLight") {
    return false;
  }
  if (raw.type === "dark" || raw.type === "hc") {
    return true;
  }
  const hex = background.length === 4 ? background.replace(/[0-9a-f]/gi, "$&$&") : background;
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  return 0.299 * (r ?? 0) + 0.587 * (g ?? 0) + 0.114 * (b ?? 0) < 128;
}

export function fromVscodeTheme(raw: unknown, fallbackName: string): Record<string, unknown> {
  const fields = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const colors = (
    typeof fields.colors === "object" && fields.colors !== null ? fields.colors : {}
  ) as Record<string, unknown>;
  const rules = readRules(fields.tokenColors);
  const globalForeground = rules.find((rule) => rule.scopes.length === 0)?.foreground ?? null;

  const background = firstColor(colors, ["editor.background"]) ?? "#1e1e1e";
  const dark = isDarkTheme(fields, background);
  const text =
    firstColor(colors, ["editor.foreground", "foreground"]) ??
    globalForeground ??
    (dark ? "#d4d4d4" : "#333333");
  const syntax = Object.fromEntries(
    Object.entries(SYNTAX_SCOPES).map(([key, scopes]) => [
      key,
      scopes.map((scope) => colorForScope(rules, scope)).find(Boolean) ?? text,
    ]),
  ) as ThemeSyntax;
  const accent =
    firstColor(colors, [
      "focusBorder",
      "button.background",
      "textLink.foreground",
      "activityBarBadge.background",
    ]) ?? syntax.function;
  const badge = firstColor(colors, ["activityBarBadge.background", "badge.background"]);
  const ui: ThemeUi = {
    bg: background,
    panel:
      firstColor(colors, [
        "sideBar.background",
        "editorGroupHeader.tabsBackground",
        "activityBar.background",
      ]) ?? background,
    accent,
    accent2: badge && badge.toLowerCase() !== accent.toLowerCase() ? badge : syntax.keyword,
    text,
  };
  const name = typeof fields.name === "string" && fields.name.trim() ? fields.name : fallbackName;
  return {
    name,
    mood: "VS Code",
    ui,
    syntax,
    background: { type: "solid", color: background },
    effects: { surface: "solid", background: false, mascot: false, animations: true },
  };
}
