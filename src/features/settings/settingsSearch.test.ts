import { describe, expect, test } from "vitest";
import { filterSettings, matchesSearch } from "./settingsSearch";

describe("matchesSearch", () => {
  test("ignores case, accents and extra spaces", () => {
    expect(matchesSearch("Pêssego theme", "PESSEGO")).toBe(true);
    expect(matchesSearch("Terminal  font", " terminal font ")).toBe(true);
  });

  test("needs every word, in any order", () => {
    expect(matchesSearch("Blinking cursor", "cursor blink")).toBe(true);
    expect(matchesSearch("Blinking cursor", "cursor shape")).toBe(false);
  });

  test("an empty search matches everything", () => {
    expect(matchesSearch("Anything", "   ")).toBe(true);
  });
});

function screenWith(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
}

const SETTINGS = `
  <section class="settings__section"><h3>Editor</h3>
    <label class="settings__field">Tab size</label>
    <label class="settings__field">Font size</label>
  </section>
  <section class="settings__section"><h3>Terminal</h3>
    <label class="settings__field">Cursor</label>
    <label class="settings__field">Padding</label>
  </section>`;

test("hides fields and whole sections that do not match", () => {
  const root = screenWith(SETTINGS);

  expect(filterSettings(root, "font")).toBe(1);

  const [editor, terminal] = root.querySelectorAll<HTMLElement>(".settings__section");
  expect(editor?.hidden).toBe(false);
  expect(terminal?.hidden).toBe(true);
  expect([...root.querySelectorAll<HTMLElement>(".settings__field")].map((f) => f.hidden)).toEqual([
    true,
    false,
    true,
    true,
  ]);
});

test("a section name shows the whole section, and clearing shows everything", () => {
  const root = screenWith(SETTINGS);

  expect(filterSettings(root, "terminal")).toBe(2);
  expect(filterSettings(root, "")).toBe(4);
  expect([...root.querySelectorAll<HTMLElement>("[hidden]")]).toHaveLength(0);
});
