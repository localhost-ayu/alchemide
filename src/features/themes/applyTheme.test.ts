import { describe, expect, test } from "vitest";
import { applyEffects, applyTheme } from "./applyTheme";
import { toCssVariables } from "./cssVariables";
import { FALLBACK_THEME } from "./fallbackTheme";

describe("toCssVariables", () => {
  test("maps ui and syntax colors to variables", () => {
    const variables = toCssVariables(FALLBACK_THEME);
    expect(variables["--color-bg"]).toBe("#16161c");
    expect(variables["--color-accent-2"]).toBe("#c9a2e8");
    expect(variables["--syntax-keyword"]).toBe("#c9a2e8");
    expect(variables["--syntax-number"]).toBe("#e8a98f");
  });

  test("converts glass settings to CSS units", () => {
    const variables = toCssVariables(FALLBACK_THEME);
    expect(variables["--glass-opacity"]).toBe("85%");
    expect(variables["--glass-blur"]).toBe("10px");
  });

  test("describes each kind of background", () => {
    const gradient = toCssVariables({
      ...FALLBACK_THEME,
      background: { type: "gradient", css: "linear-gradient(red, blue)" },
    });
    expect(gradient["--backdrop-image"]).toBe("linear-gradient(red, blue)");
    expect(gradient["--backdrop-dim"]).toBe("0%");

    const image = toCssVariables({
      ...FALLBACK_THEME,
      background: { type: "image", path: "a.png", fit: "cover", blur: 4, dim: 0.55 },
    });
    expect(image["--backdrop-dim"]).toBe("55%");
    expect(image["--backdrop-blur"]).toBe("4px");

    const solid = toCssVariables(FALLBACK_THEME);
    expect(solid["--backdrop-color"]).toBe("#16161c");
    expect(solid["--backdrop-image"]).toBe("none");
  });
});

test("applyTheme writes the variables and the theme name on the root element", () => {
  const root = document.createElement("html");

  applyTheme(FALLBACK_THEME, root);

  expect(root.style.getPropertyValue("--color-text")).toBe("#e4e4ea");
  expect(root.dataset.theme).toBe("Reserva");
});

test("applyEffects changes only the requested effect", () => {
  const root = document.createElement("html");
  applyEffects({ surface: "glass", background: true, mascot: true, animations: true }, root);

  applyEffects({ surface: "solid" }, root);

  expect(root.dataset.surface).toBe("solid");
  expect(root.dataset.background).toBe("true");
  expect(root.dataset.mascot).toBe("true");
  expect(root.dataset.animations).toBe("true");
});
