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

  test("turns the shape into corner and interface font variables", () => {
    const variables = toCssVariables({ ...FALLBACK_THEME, shape: { radius: 13, font: "mono" } });
    expect(variables["--radius"]).toBe("13px");
    expect(variables["--radius-sm"]).toBe("7px");
    expect(variables["--font-ui"]).toBe("var(--font-code)");
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

test("applyTheme describes the mascot and the background fit for CSS", () => {
  const root = document.createElement("html");

  applyTheme(
    {
      ...FALLBACK_THEME,
      background: { type: "image", path: "a.png", fit: "contain", blur: 0, dim: 0.5 },
      mascot: { path: "m.png", corner: "top-left", opacity: 0.4, size: 200 },
    },
    root,
  );

  expect(root.dataset.mascotCorner).toBe("top-left");
  expect(root.dataset.backdropFit).toBe("contain");
  expect(root.style.getPropertyValue("--mascot-size")).toBe("200px");
  expect(root.style.getPropertyValue("--mascot-opacity")).toBe("0.4");

  applyTheme(FALLBACK_THEME, root);

  expect(root.dataset.backdropFit).toBe("cover");
  expect(root.style.getPropertyValue("--mascot-opacity")).toBe("0");
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

test("each effect works on its own: solid surface keeps the background", () => {
  const root = document.createElement("html");
  applyEffects({ surface: "glass", background: true, mascot: false, animations: false }, root);

  applyEffects({ background: false }, root);
  applyEffects({ surface: "solid" }, root);

  expect(root.dataset).toMatchObject({
    surface: "solid",
    background: "false",
    mascot: "false",
    animations: "false",
  });
});

test("applyTheme places a moved mascot freely and on its layer", () => {
  const root = document.createElement("html");
  const mascot = { path: "m.png", corner: "top-left" as const, opacity: 0.4, size: 200 };

  applyTheme({ ...FALLBACK_THEME, mascot }, root);
  expect(root.dataset.mascotCorner).toBe("top-left");
  expect(root.dataset.mascotLayer).toBe("behind");

  applyTheme(
    { ...FALLBACK_THEME, mascot: { ...mascot, layer: "front", position: { x: 0.25, y: 1 } } },
    root,
  );
  expect(root.dataset.mascotCorner).toBe("free");
  expect(root.dataset.mascotLayer).toBe("front");
  expect(root.style.getPropertyValue("--mascot-x")).toBe("0.25");
  expect(root.style.getPropertyValue("--mascot-y")).toBe("1");
});

test("applyTheme describes what sits behind open files, with layer as the default", () => {
  const root = document.createElement("html");
  const image = { type: "image" as const, path: "a.png", fit: "cover" as const, blur: 0, dim: 0.5 };

  applyTheme({ ...FALLBACK_THEME, background: image }, root);
  expect(root.dataset.editorBackdrop).toBe("layer");
  expect(root.style.getPropertyValue("--layer-dim")).toBe("70%");
  expect(root.style.getPropertyValue("--layer-blur")).toBe("10px");

  applyTheme(
    { ...FALLBACK_THEME, background: { ...image, editor: { mode: "solid", dim: 0.2, blur: 3 } } },
    root,
  );
  expect(root.dataset.editorBackdrop).toBe("solid");
  expect(root.style.getPropertyValue("--layer-dim")).toBe("20%");

  applyTheme(FALLBACK_THEME, root);
  expect(root.dataset.editorBackdrop).toBe("sharp");
  expect(root.style.getPropertyValue("--layer-blur")).toBe("0px");
});
