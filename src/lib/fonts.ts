const BUNDLED_FONT_LOADERS = {
  "Maple Mono": () =>
    Promise.all([
      import("@fontsource/maple-mono/latin-400.css"),
      import("@fontsource/maple-mono/latin-700.css"),
    ]),
  "JetBrains Mono": () =>
    Promise.all([
      import("@fontsource/jetbrains-mono/latin-400.css"),
      import("@fontsource/jetbrains-mono/latin-ext-400.css"),
      import("@fontsource/jetbrains-mono/latin-700.css"),
    ]),
  "Adwaita Mono": () =>
    Promise.all([
      import("@fontsource/adwaita-mono/latin-400.css"),
      import("@fontsource/adwaita-mono/latin-700.css"),
    ]),
  "Fira Code": () =>
    Promise.all([
      import("@fontsource/fira-code/latin-400.css"),
      import("@fontsource/fira-code/latin-ext-400.css"),
      import("@fontsource/fira-code/latin-700.css"),
    ]),
  "Cascadia Code": () =>
    Promise.all([
      import("@fontsource/cascadia-code/latin-400.css"),
      import("@fontsource/cascadia-code/latin-ext-400.css"),
      import("@fontsource/cascadia-code/latin-700.css"),
    ]),
  "IBM Plex Mono": () =>
    Promise.all([
      import("@fontsource/ibm-plex-mono/latin-400.css"),
      import("@fontsource/ibm-plex-mono/latin-ext-400.css"),
      import("@fontsource/ibm-plex-mono/latin-700.css"),
    ]),
} satisfies Record<string, () => Promise<unknown>>;

export type BundledFont = keyof typeof BUNDLED_FONT_LOADERS;

export const BUNDLED_FONTS = Object.keys(BUNDLED_FONT_LOADERS) as BundledFont[];

export const DEFAULT_FONT: BundledFont = "Maple Mono";

const loaded = new Map<BundledFont, Promise<void>>();

export function isBundledFont(family: string): family is BundledFont {
  return family in BUNDLED_FONT_LOADERS;
}

export function loadBundledFont(family: string): Promise<void> {
  if (!isBundledFont(family)) {
    return Promise.resolve();
  }
  let pending = loaded.get(family);
  if (!pending) {
    pending = BUNDLED_FONT_LOADERS[family]()
      .then(() => document.fonts?.load(`16px "${family}"`))
      .then(
        () => undefined,
        () => undefined,
      );
    loaded.set(family, pending);
  }
  return pending;
}
