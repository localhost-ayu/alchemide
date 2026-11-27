export type ThemeUi = {
  bg: string;
  panel: string;
  accent: string;
  accent2: string;
  text: string;
};

export type ThemeSyntax = {
  keyword: string;
  string: string;
  function: string;
  comment: string;
  variable: string;
  type: string;
  number: string;
};

export type Fit = "cover" | "contain";

export type ThemeBackground =
  | { type: "solid"; color: string }
  | { type: "gradient"; css: string }
  | { type: "image" | "video"; path: string; fit: Fit; blur: number; dim: number };

export type MediaBackground = Extract<ThemeBackground, { type: "image" | "video" }>;

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type MascotLayer = "behind" | "front";

export type MascotPosition = { x: number; y: number };

export type ThemeMascot = {
  path: string;
  corner: Corner;
  opacity: number;
  size: number;
  layer?: MascotLayer;
  position?: MascotPosition;
};

export type UiFont = "system" | "rounded" | "serif" | "mono";

export type ThemeShape = {
  radius: number;
  font: UiFont;
};

export type Effects = {
  surface: "glass" | "solid";
  background: boolean;
  mascot: boolean;
  animations: boolean;
};

export type Theme = {
  name: string;
  mood: string;
  ui: ThemeUi;
  syntax: ThemeSyntax;
  background: ThemeBackground;
  glass: { panelOpacity: number; blur: number };
  shape: ThemeShape;
  mascot: ThemeMascot | null;
  effects: Effects;
};
