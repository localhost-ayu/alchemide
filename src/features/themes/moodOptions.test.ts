import { expect, test } from "vitest";
import { setLanguagePreference } from "../../lib/i18n";
import { filterOptions, moodOptions } from "./moodOptions";

test("lists every theme by group and then the effect presets", () => {
  const options = moodOptions();
  expect(options[0]).toMatchObject({ kind: "theme", label: "Catalisador", group: "Laboratório" });
  expect(options.filter((option) => option.group === "Pastéis").map((o) => o.label)).toEqual([
    "Lavanda",
    "Menta",
    "Pêssego",
  ]);
  expect(options.filter((option) => option.group === "Effects").map((o) => o.label)).toEqual([
    "Laboratório",
    "Focado",
    "Só wallpaper",
  ]);
});

test("filters by name or group, ignoring accents and case", () => {
  const labels = (query: string) => filterOptions(moodOptions(), query).map((o) => o.label);
  expect(labels("pessego")).toEqual(["Pêssego"]);
  expect(labels("FERREAS")).toEqual(["Ferrugem", "Cobre", "Aço"]);
  expect(labels("  ")).toHaveLength(14);
});

test("offers to pick a background and a mascot, and to remove them once set", () => {
  const actions = (custom: Parameters<typeof moodOptions>[1]) =>
    moodOptions(undefined, custom)
      .filter((option) => option.kind === "action")
      .map((option) => option.label);

  expect(actions({ background: null, mascot: null })).toEqual([
    "Choose background image or video…",
    "Choose mascot image…",
  ]);
  expect(
    actions({
      background: { type: "image", path: "backgrounds/a.png", fit: "cover", blur: 0, dim: 0.5 },
      mascot: { path: "mascots/m.png", corner: "bottom-right", opacity: 0.35, size: 280 },
    }),
  ).toEqual([
    "Choose background image or video…",
    "Choose mascot image…",
    "Remove custom background",
    "Remove mascot",
  ]);
});

test("group names follow the interface language", () => {
  setLanguagePreference("pt-BR");
  const groups = new Set(moodOptions().map((option) => option.group));
  setLanguagePreference("en");
  expect(groups.has("Efeitos")).toBe(true);
  expect(groups.has("Personalizar")).toBe(true);
  expect(groups.has("Laboratório")).toBe(true);
});
