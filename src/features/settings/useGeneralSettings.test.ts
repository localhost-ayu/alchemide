import { beforeEach, expect, test } from "vitest";
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
  expect(readGeneralSettings(undefined)).toEqual({ reopenLastFolder: true });
  expect(readGeneralSettings({ reopenLastFolder: false })).toEqual({ reopenLastFolder: false });
  expect(readGeneralSettings({ reopenLastFolder: "no" })).toEqual({ reopenLastFolder: true });
});

test("saves the choice and reads it back on start", async () => {
  await useGeneralSettings.getState().update({ reopenLastFolder: false });
  expect(await loadSettings()).toEqual({ general: { reopenLastFolder: false } });

  useGeneralSettings.setState(DEFAULT_GENERAL_SETTINGS);
  expect(await initGeneralSettings()).toEqual({ reopenLastFolder: false });
});
