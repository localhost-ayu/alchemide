import { beforeEach, expect, test } from "vitest";
import { useLanguageStore } from "../../lib/i18n";
import { loadSettings, saveSettings } from "../../lib/ipc.mock";
import {
  DEFAULT_GENERAL_SETTINGS,
  initGeneralSettings,
  readGeneralSettings,
  useGeneralSettings,
} from "./useGeneralSettings";

beforeEach(async () => {
  await saveSettings({});
  useGeneralSettings.setState(DEFAULT_GENERAL_SETTINGS);
});

test("reopens the last folder unless turned off", () => {
  const off = { closePanelsOnOutsideClick: false, language: "system" };
  expect(readGeneralSettings(undefined)).toEqual({ reopenLastFolder: true, ...off });
  expect(readGeneralSettings({ reopenLastFolder: false })).toEqual({
    reopenLastFolder: false,
    ...off,
  });
  expect(readGeneralSettings({ reopenLastFolder: "no" })).toEqual({
    reopenLastFolder: true,
    ...off,
  });
});

test("saves the choice and reads it back on start", async () => {
  await useGeneralSettings.getState().update({ reopenLastFolder: false });
  const saved = { reopenLastFolder: false, closePanelsOnOutsideClick: false, language: "system" };
  expect(await loadSettings()).toEqual({ general: saved });

  useGeneralSettings.setState(DEFAULT_GENERAL_SETTINGS);
  expect(await initGeneralSettings()).toEqual(saved);
});

test("closing panels on an outside click is off unless turned on", () => {
  expect(readGeneralSettings({}).closePanelsOnOutsideClick).toBe(false);
  expect(readGeneralSettings({ closePanelsOnOutsideClick: true }).closePanelsOnOutsideClick).toBe(
    true,
  );
});

test("reads the language and keeps it when another option changes", async () => {
  expect(readGeneralSettings({ language: "pt-BR" }).language).toBe("pt-BR");
  expect(readGeneralSettings({ language: "klingon" }).language).toBe("system");

  await useGeneralSettings.getState().update({ language: "pt-BR" });
  await useGeneralSettings.getState().update({ reopenLastFolder: false });
  expect(await loadSettings()).toMatchObject({ general: { language: "pt-BR" } });
  expect(useLanguageStore.getState().language).toBe("pt-BR");
  await useGeneralSettings.getState().update({ language: "en" });
});
