import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { format, resolveLanguage, setLanguagePreference, t, translate, useT } from "./i18n";
import { en } from "./locales/en";
import { ptBR } from "./locales/ptBR";

afterEach(() => setLanguagePreference("en"));

test("follows the system language for Portuguese and falls back to English", () => {
  expect(resolveLanguage("system", ["pt-BR", "en-US"])).toBe("pt-BR");
  expect(resolveLanguage("system", ["pt-PT"])).toBe("pt-BR");
  expect(resolveLanguage("system", ["de-DE", "pt-BR"])).toBe("pt-BR");
  expect(resolveLanguage("system", ["en-GB"])).toBe("en");
  expect(resolveLanguage("system", [])).toBe("en");
  expect(resolveLanguage("en", ["pt-BR"])).toBe("en");
});

test("fills placeholders and leaves unknown ones visible", () => {
  expect(format("Close {name}", { name: "a.ts" })).toBe("Close a.ts");
  expect(format("{count} files", { count: 3 })).toBe("3 files");
  expect(format("Close {name}")).toBe("Close {name}");
});

test("every Portuguese text keeps the placeholders of its English source", () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const key of Object.keys(en) as (keyof typeof en)[]) {
    expect(placeholders(ptBR[key]), key).toEqual(placeholders(en[key]));
  }
});

test("switches live for hooks and plain calls, and marks the document language", () => {
  const { result } = renderHook(() => useT());
  expect(result.current("settings.language")).toBe("Language");

  act(() => setLanguagePreference("pt-BR"));
  expect(result.current("settings.language")).toBe("Idioma");
  expect(t("settings.general")).toBe("Geral");
  expect(translate("en", "settings.general")).toBe("General");
  expect(document.documentElement.lang).toBe("pt-BR");
});
