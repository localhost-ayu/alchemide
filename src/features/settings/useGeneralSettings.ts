import { create } from "zustand";
import { setCloseOnOutsideClick } from "../../lib/dismiss";
import {
  LANGUAGE_PREFERENCES,
  type LanguagePreference,
  setLanguagePreference,
} from "../../lib/i18n";
import { loadSettings, saveSettings } from "../../lib/ipc";

export type GeneralSettings = {
  reopenLastFolder: boolean;
  closePanelsOnOutsideClick: boolean;
  language: LanguagePreference;
};

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  reopenLastFolder: true,
  closePanelsOnOutsideClick: false,
  language: "system",
};

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function readGeneralSettings(raw: unknown): GeneralSettings {
  const fields = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    reopenLastFolder: flag(fields.reopenLastFolder, DEFAULT_GENERAL_SETTINGS.reopenLastFolder),
    closePanelsOnOutsideClick: flag(
      fields.closePanelsOnOutsideClick,
      DEFAULT_GENERAL_SETTINGS.closePanelsOnOutsideClick,
    ),
    language:
      LANGUAGE_PREFERENCES.find((preference) => preference === fields.language) ??
      DEFAULT_GENERAL_SETTINGS.language,
  };
}

function apply(general: GeneralSettings): void {
  setCloseOnOutsideClick(general.closePanelsOnOutsideClick);
  setLanguagePreference(general.language);
}

type State = GeneralSettings & {
  update: (changes: Partial<GeneralSettings>) => Promise<void>;
};

export const useGeneralSettings = create<State>((set, get) => ({
  ...DEFAULT_GENERAL_SETTINGS,
  update: async (changes) => {
    const next = readGeneralSettings({ ...get(), ...changes });
    set(next);
    apply(next);
    try {
      const settings = await loadSettings();
      await saveSettings({ ...settings, general: next });
    } catch {
      return;
    }
  },
}));

export async function initGeneralSettings(): Promise<GeneralSettings> {
  try {
    const general = readGeneralSettings((await loadSettings()).general);
    useGeneralSettings.setState(general);
    apply(general);
    return general;
  } catch {
    apply(DEFAULT_GENERAL_SETTINGS);
    return DEFAULT_GENERAL_SETTINGS;
  }
}
