import type { Theme } from "./theme";

export function applyStartingPoint(current: Theme, start: Theme): Theme {
  const keepsMedia = current.background.type === "image" || current.background.type === "video";
  return {
    ...current,
    ui: start.ui,
    syntax: start.syntax,
    glass: start.glass,
    shape: start.shape,
    background: keepsMedia ? current.background : start.background,
  };
}
