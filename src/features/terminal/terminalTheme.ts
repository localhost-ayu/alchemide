import type { ITheme } from "@xterm/xterm";

export const REAGENT_GREEN = "#8dff5a";

type Read = (variable: string) => string;

const HEX6 = /^#[0-9a-f]{6}$/i;

function withAlpha(color: string, alpha: string): string {
  return HEX6.test(color) ? `${color}${alpha}` : color;
}

export function terminalTheme(read: Read, playful: boolean): ITheme {
  const text = read("--color-text");
  const keyword = read("--syntax-keyword");
  const string = read("--syntax-string");
  const fn = read("--syntax-function");
  const type = read("--syntax-type");
  const comment = read("--syntax-comment");
  const accent2 = read("--color-accent-2");
  const bg = read("--color-bg");
  const light = read("--color-scheme") === "light";
  const dark = light ? text : bg;
  const bright = light ? bg : text;
  return {
    background: read("--color-panel") || bg,
    foreground: text,
    cursor: playful ? REAGENT_GREEN : text,
    cursorAccent: bg,
    selectionBackground: withAlpha(accent2, "55"),
    black: dark,
    red: accent2,
    green: string,
    yellow: fn,
    blue: type,
    magenta: keyword,
    cyan: type,
    white: bright,
    brightBlack: comment,
    brightRed: accent2,
    brightGreen: string,
    brightYellow: fn,
    brightBlue: type,
    brightMagenta: keyword,
    brightCyan: type,
    brightWhite: bright,
  };
}

export function readRootVariable(variable: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}
