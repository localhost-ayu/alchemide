import { toCssVariables } from "./cssVariables";
import type { Effects, Theme } from "./theme";

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  for (const [name, value] of Object.entries(toCssVariables(theme))) {
    root.style.setProperty(name, value);
  }
  root.dataset.theme = theme.name;
}

export function applyEffects(
  effects: Partial<Effects>,
  root: HTMLElement = document.documentElement,
): void {
  for (const [name, value] of Object.entries(effects)) {
    root.dataset[name] = String(value);
  }
}
