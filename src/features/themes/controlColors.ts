import { AA_CONTRAST, contrast, mixColors } from "./colors";
import type { ThemeUi } from "./theme";

export type ControlColors = {
  background: string;
  text: string;
  scheme: "dark" | "light";
  onAccent: string;
};

const BLACK = "#000000";
const WHITE = "#ffffff";

export function controlColors(ui: ThemeUi): ControlColors {
  const background = mixColors(ui.bg, ui.panel, 0.6);
  const fallback = contrast(WHITE, background) >= contrast(BLACK, background) ? WHITE : BLACK;
  const text = contrast(ui.text, background) >= AA_CONTRAST ? ui.text : fallback;
  const scheme = contrast(WHITE, background) >= contrast(BLACK, background) ? "dark" : "light";
  const strongest = contrast(WHITE, ui.accent) >= contrast(BLACK, ui.accent) ? WHITE : BLACK;
  const onAccent = contrast(ui.bg, ui.accent) >= 3 ? ui.bg : strongest;
  return { background, text, scheme, onAccent };
}
