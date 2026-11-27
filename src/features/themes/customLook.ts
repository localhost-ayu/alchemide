import { readBackground, readMascot } from "./parseTheme";
import type { MediaBackground, Theme, ThemeBackground, ThemeMascot } from "./theme";

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

export type Look = {
  theme: Theme;
  custom: CustomLook;
};

export type BackgroundChanges = Partial<Pick<MediaBackground, "fit" | "blur" | "dim" | "editor">>;
export type MascotChanges = Partial<Omit<ThemeMascot, "path">>;

function asMedia(background: ThemeBackground | null): MediaBackground | null {
  return background?.type === "image" || background?.type === "video" ? background : null;
}

export function shownBackground(look: Look): MediaBackground | null {
  return asMedia(look.custom.background) ?? asMedia(look.theme.background);
}

export function shownMascot(look: Look): ThemeMascot | null {
  return look.custom.mascot ?? look.theme.mascot;
}

export function changeBackground(look: Look, changes: BackgroundChanges): Look {
  const custom = asMedia(look.custom.background);
  if (custom) {
    return { ...look, custom: { ...look.custom, background: { ...custom, ...changes } } };
  }
  const own = asMedia(look.theme.background);
  if (!own) {
    return look;
  }
  return { ...look, theme: { ...look.theme, background: { ...own, ...changes } } };
}

export function changeMascot(look: Look, changes: MascotChanges): Look {
  if (look.custom.mascot) {
    return { ...look, custom: { ...look.custom, mascot: { ...look.custom.mascot, ...changes } } };
  }
  if (!look.theme.mascot) {
    return look;
  }
  return { ...look, theme: { ...look.theme, mascot: { ...look.theme.mascot, ...changes } } };
}
