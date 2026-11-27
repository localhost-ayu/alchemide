import { DEFAULT_EFFECTS, DEFAULT_SHAPE } from "./parseTheme";
import type { Theme } from "./theme";

export const FALLBACK_THEME: Theme = {
  name: "Reserva",
  mood: "fallback",
  ui: { bg: "#16161c", panel: "#1e1e26", accent: "#9ad0a5", accent2: "#c9a2e8", text: "#e4e4ea" },
  syntax: {
    keyword: "#c9a2e8",
    string: "#9ad0a5",
    function: "#e8cf8f",
    comment: "#6c6c7c",
    variable: "#b9c4e8",
    type: "#8fc8e8",
    number: "#e8a98f",
  },
  background: { type: "solid", color: "#16161c" },
  glass: { panelOpacity: 0.85, blur: 10 },
  shape: DEFAULT_SHAPE,
  mascot: null,
  effects: DEFAULT_EFFECTS,
};
