import { editorBackdropOf, toCssVariables } from "./cssVariables";
import type { Effects, Theme } from "./theme";

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  for (const [name, value] of Object.entries(toCssVariables(theme))) {
    root.style.setProperty(name, value);
  }
  root.dataset.theme = theme.name;
  root.dataset.mascotCorner = theme.mascot?.corner ?? "bottom-right";
  root.dataset.backdropFit = "fit" in theme.background ? theme.background.fit : "cover";
  root.dataset.editorBackdrop = editorBackdropOf(theme)?.mode ?? "sharp";
}

export function applyEffects(
  effects: Partial<Effects>,
  root: HTMLElement = document.documentElement,
): void {
  for (const [name, value] of Object.entries(effects)) {
    root.dataset[name] = String(value);
  }
}
