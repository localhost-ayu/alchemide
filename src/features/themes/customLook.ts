import { readBackground, readMascot } from "./parseTheme";
import type { Theme, ThemeBackground, ThemeMascot } from "./theme";

export type CustomLook = {
  background: ThemeBackground | null;
  mascot: ThemeMascot | null;
};

export const NO_CUSTOM_LOOK: CustomLook = { background: null, mascot: null };

const VIDEO = /\.(?:mp4|webm)$/i;

export function backgroundFromPath(path: string): ThemeBackground {
  return { type: VIDEO.test(path) ? "video" : "image", path, fit: "cover", blur: 0, dim: 0.55 };
}

export function mascotFromPath(path: string): ThemeMascot {
  return { path, corner: "bottom-right", opacity: 0.35, size: 280 };
}

export function readCustomLook(settings: Record<string, unknown>, theme: Theme): CustomLook {
  const ignored: string[] = [];
  const background =
    settings.background === undefined
      ? null
      : readBackground(settings.background, theme.ui, ignored);
  const isMedia = background?.type === "image" || background?.type === "video";
  return {
    background: isMedia ? background : null,
    mascot: readMascot(settings.mascot, ignored),
  };
}

export function withCustomLook(theme: Theme, custom: CustomLook): Theme {
  return {
    ...theme,
    background: custom.background ?? theme.background,
    mascot: custom.mascot ?? theme.mascot,
  };
}
