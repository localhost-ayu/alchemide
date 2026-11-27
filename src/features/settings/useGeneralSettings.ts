import { create } from "zustand";
import { loadSettings, saveSettings } from "../../lib/ipc";

export type GeneralSettings = {
  reopenLastFolder: boolean;
};

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = { reopenLastFolder: true };

export function readGeneralSettings(raw: unknown): GeneralSettings {
  const fields = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    reopenLastFolder:
      typeof fields.reopenLastFolder === "boolean"
        ? fields.reopenLastFolder
        : DEFAULT_GENERAL_SETTINGS.reopenLastFolder,
  };
}

type State = GeneralSettings & {
  update: (changes: Partial<GeneralSettings>) => Promise<void>;
};

export const useGeneralSettings = create<State>((set, get) => ({
  ...DEFAULT_GENERAL_SETTINGS,
  update: async (changes) => {
    const next = readGeneralSettings({ reopenLastFolder: get().reopenLastFolder, ...changes });
    set(next);
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
    return general;
  } catch {
    return DEFAULT_GENERAL_SETTINGS;
  }
}
