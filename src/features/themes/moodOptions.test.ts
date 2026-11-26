import { expect, test } from "vitest";
import { filterOptions, moodOptions } from "./moodOptions";

test("lists every theme by group and then the effect presets", () => {
  const options = moodOptions();
  expect(options[0]).toMatchObject({ kind: "theme", label: "Catalisador", group: "Laboratório" });
  expect(options.filter((option) => option.group === "Pastéis").map((o) => o.label)).toEqual([
    "Lavanda",
    "Menta",
    "Pêssego",
  ]);
  expect(options.slice(-3).map((option) => option.label)).toEqual([
    "Laboratório",
    "Focado",
    "Só wallpaper",
  ]);
});

test("filters by name or group, ignoring accents and case", () => {
  const labels = (query: string) => filterOptions(moodOptions(), query).map((o) => o.label);
  expect(labels("pessego")).toEqual(["Pêssego"]);
  expect(labels("FERREAS")).toEqual(["Ferrugem", "Cobre", "Aço"]);
  expect(labels("  ")).toHaveLength(12);
});
