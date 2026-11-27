import { describe, expect, test } from "vitest";
import catalisador from "./builtin/catalisador.json";
import { FALLBACK_THEME } from "./fallbackTheme";
import { DEFAULT_EFFECTS, parseTheme, readTheme } from "./parseTheme";

const minimal = {
  name: "Minimal",
  ui: { bg: "#000000", panel: "#111111", accent: "#22ff22", accent2: "#ff22ff", text: "#ffffff" },
  syntax: {
    keyword: "#ff0000",
    string: "#00ff00",
    function: "#0000ff",
    comment: "#888888",
    variable: "#ffffff",
  },
};

function parse(input: unknown) {
  return parseTheme(input, FALLBACK_THEME);
}

describe("parseTheme", () => {
  test("accepts every built-in theme without warnings", () => {
    const { theme, warnings } = parse(catalisador);
    expect(warnings).toEqual([]);
    expect(theme.name).toBe("Catalisador");
    expect(theme.background).toEqual({
      type: "gradient",
      css: "radial-gradient(circle at 80% 110%, #2b1f45 0%, #120f1a 55%)",
    });
  });

  test("fills optional sections with defaults", () => {
    const { theme, warnings } = parse(minimal);
    expect(warnings).toEqual([]);
    expect(theme.syntax.type).toBe("#ff22ff");
    expect(theme.syntax.number).toBe("#22ff22");
    expect(theme.background).toEqual({ type: "solid", color: "#000000" });
    expect(theme.glass).toEqual({ panelOpacity: 0.78, blur: 12 });
    expect(theme.mascot).toBeNull();
    expect(theme.effects).toEqual(DEFAULT_EFFECTS);
  });

  test.each([
    ["not an object", "[]"],
    ["no name", { ...minimal, name: "" }],
    ["incomplete ui", { ...minimal, ui: { ...minimal.ui, text: undefined } }],
    ["ui color that is not hex", { ...minimal, ui: { ...minimal.ui, bg: "red" } }],
    ["missing syntax", { ...minimal, syntax: undefined }],
  ])("falls back to the reserve theme with a warning for %s", (_case, input) => {
    const { theme, warnings } = parse(input);
    expect(theme).toBe(FALLBACK_THEME);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("using Reserva");
  });

  test("keeps the theme but drops an invalid background", () => {
    const { theme, warnings } = parse({
      ...minimal,
      background: { type: "gradient", css: "url(https://example.com/x.png)" },
    });
    expect(theme.name).toBe("Minimal");
    expect(theme.background).toEqual({ type: "solid", color: "#000000" });
    expect(warnings).toEqual(["background is invalid; using a solid background"]);
  });

  test("rejects gradients that would load remote content", () => {
    const { theme } = parse({
      ...minimal,
      background: { type: "gradient", css: "linear-gradient(url(https://x.y/a.png), red)" },
    });
    expect(theme.background.type).toBe("solid");
  });

  test("accepts image backgrounds only with relative paths inside the config folder", () => {
    const image = (path: string) =>
      parse({ ...minimal, background: { type: "image", path, blur: 4, dim: 0.55 } }).theme
        .background;
    expect(image("backgrounds/lab.png")).toEqual({
      type: "image",
      path: "backgrounds/lab.png",
      fit: "cover",
      blur: 4,
      dim: 0.55,
    });
    expect(image("../secrets.png").type).toBe("solid");
    expect(image("/etc/passwd").type).toBe("solid");
    expect(image("C:\\Users\\me\\a.png").type).toBe("solid");
  });

  test("clamps numbers out of range to defaults", () => {
    const { theme } = parse({
      ...minimal,
      glass: { panelOpacity: 7, blur: -1 },
      mascot: { path: "mascots/m.png", opacity: 2, size: 10, corner: "middle" },
    });
    expect(theme.glass).toEqual({ panelOpacity: 0.78, blur: 12 });
    expect(theme.mascot).toEqual({
      path: "mascots/m.png",
      corner: "bottom-right",
      opacity: 0.35,
      size: 280,
    });
  });

  test("warns about optional syntax colors that are not hex", () => {
    const { theme, warnings } = parse({ ...minimal, syntax: { ...minimal.syntax, type: "blue" } });
    expect(theme.syntax.type).toBe("#ff22ff");
    expect(warnings).toEqual(["syntax.type is not a hex color; using a default"]);
  });
});

test("reads the shape and falls back to the default for missing or invalid values", () => {
  const base = {
    name: "Forma",
    ui: { bg: "#000000", panel: "#111111", accent: "#22aa22", accent2: "#aa22aa", text: "#eeeeee" },
    syntax: {
      keyword: "#aa22aa",
      string: "#22aa22",
      function: "#aaaa22",
      comment: "#777777",
      variable: "#eeeeee",
    },
  };

  expect(readTheme(base).theme?.shape).toEqual({ radius: 8, font: "system" });
  expect(readTheme({ ...base, shape: { radius: 12.6, font: "serif" } }).theme?.shape).toEqual({
    radius: 13,
    font: "serif",
  });
  expect(readTheme({ ...base, shape: { radius: 99, font: "comic" } }).theme?.shape).toEqual({
    radius: 8,
    font: "system",
  });
});

test("reads the mascot layer and position, ignoring invalid ones", () => {
  const mascot = (fields: Record<string, unknown>) =>
    parse({ ...minimal, mascot: { path: "mascots/m.png", ...fields } }).theme.mascot;

  expect(mascot({ layer: "front", position: { x: 0.2, y: 0.9 } })).toMatchObject({
    layer: "front",
    position: { x: 0.2, y: 0.9 },
  });
  const invalid = mascot({ layer: "sideways", position: { x: 2, y: 0.5 } });
  expect(invalid).not.toHaveProperty("layer");
  expect(invalid).not.toHaveProperty("position");
});
