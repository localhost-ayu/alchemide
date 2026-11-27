import { controlColors } from "./controlColors";
import type { Theme, UiFont } from "./theme";

const UI_FONT_STACKS: Record<UiFont, string> = {
  system: "system-ui, sans-serif",
  rounded:
    'ui-rounded, "SF Pro Rounded", "Segoe UI Variable Display", "Nunito", system-ui, sans-serif',
  serif: 'ui-serif, "Iowan Old Style", Georgia, "Times New Roman", serif',
  mono: "var(--font-code)",
};

function backgroundImage(theme: Theme): string {
  switch (theme.background.type) {
    case "solid":
      return "none";
    case "gradient":
      return theme.background.css;
    case "image":
    case "video":
      return "none";
  }
}

function hasMedia(theme: Theme): boolean {
  return theme.background.type === "image" || theme.background.type === "video";
}

function dimOf(theme: Theme): number {
  return "dim" in theme.background ? theme.background.dim : 0;
}

function blurOf(theme: Theme): number {
  return "blur" in theme.background ? theme.background.blur : 0;
}

export function toCssVariables(theme: Theme): Record<string, string> {
  const { ui, syntax, glass, background, mascot, shape } = theme;
  const controls = controlColors(ui);
  return {
    "--color-bg": ui.bg,
    "--color-panel": ui.panel,
    "--color-accent": ui.accent,
    "--color-accent-2": ui.accent2,
    "--color-text": ui.text,
    "--syntax-keyword": syntax.keyword,
    "--syntax-string": syntax.string,
    "--syntax-function": syntax.function,
    "--syntax-comment": syntax.comment,
    "--syntax-variable": syntax.variable,
    "--syntax-type": syntax.type,
    "--syntax-number": syntax.number,
    "--glass-opacity": `${Math.round(glass.panelOpacity * 100)}%`,
    "--glass-blur": `${glass.blur}px`,
    "--backdrop-color": background.type === "solid" ? background.color : ui.bg,
    "--backdrop-image": backgroundImage(theme),
    "--backdrop-dim": hasMedia(theme) ? `${Math.round(dimOf(theme) * 100)}%` : "0%",
    "--backdrop-blur": hasMedia(theme) ? `${blurOf(theme)}px` : "0px",
    "--mascot-size": `${mascot?.size ?? 0}px`,
    "--mascot-opacity": String(mascot?.opacity ?? 0),
    "--radius": `${shape.radius}px`,
    "--radius-sm": `${Math.round(shape.radius / 2)}px`,
    "--font-ui": UI_FONT_STACKS[shape.font],
    "--control-bg": controls.background,
    "--control-text": controls.text,
    "--color-scheme": controls.scheme,
    "--color-on-accent": controls.onAccent,
  };
}
