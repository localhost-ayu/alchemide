import { create } from "zustand";
import { setCloseOnOutsideClick } from "../../lib/dismiss";
import { loadSettings, saveSettings } from "../../lib/ipc";

export type GeneralSettings = {
  reopenLastFolder: boolean;
  closePanelsOnOutsideClick: boolean;
};

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  reopenLastFolder: true,
  closePanelsOnOutsideClick: false,
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
  };
}

type State = GeneralSettings & {
  update: (changes: Partial<GeneralSettings>) => Promise<void>;
};

export const useGeneralSettings = create<State>((set, get) => ({
  ...DEFAULT_GENERAL_SETTINGS,
  update: async (changes) => {
    const { reopenLastFolder, closePanelsOnOutsideClick } = get();
    const next = readGeneralSettings({ reopenLastFolder, closePanelsOnOutsideClick, ...changes });
    set(next);
    setCloseOnOutsideClick(next.closePanelsOnOutsideClick);
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
    setCloseOnOutsideClick(general.closePanelsOnOutsideClick);
    return general;
  } catch {
    return DEFAULT_GENERAL_SETTINGS;
  }
}
