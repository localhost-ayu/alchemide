import { create } from "zustand";
import { useActivityStore } from "../../lib/activityStore";
import { t } from "../../lib/i18n";
import { checkUpdate, installUpdate, loadSettings, saveSettings } from "../../lib/ipc";
import type { UpdateInfo } from "../../lib/types";

type UpdaterState = {
  checkOnStart: boolean;
  available: UpdateInfo | null;
  installing: boolean;
  error: string | null;
  check: (announceNoUpdate: boolean) => Promise<void>;
  install: () => Promise<void>;
  dismiss: () => void;
  setCheckOnStart: (enabled: boolean) => Promise<void>;
};

export function readCheckOnStart(updates: unknown): boolean {
  if (typeof updates !== "object" || updates === null) {
    return true;
  }
  const check = (updates as Record<string, unknown>).checkOnStart;
  return typeof check === "boolean" ? check : true;
}

export const useUpdaterStore = create<UpdaterState>((set) => ({
  checkOnStart: true,
  available: null,
  installing: false,
  error: null,
  check: async (announceNoUpdate) => {
    try {
      const available = await checkUpdate();
      set({ available, error: null });
      if (!available && announceNoUpdate) {
        useActivityStore.getState().notify(t("updates.upToDate"));
      }
    } catch (error) {
      if (announceNoUpdate) {
        useActivityStore.getState().notify(t("updates.checkFailed", { error: String(error) }));
      }
    }
  },
  install: async () => {
    set({ installing: true, error: null });
    try {
      await installUpdate();
    } catch (error) {
      set({ installing: false, error: String(error) });
    }
  },
  dismiss: () => set({ available: null }),
  setCheckOnStart: async (enabled) => {
    set({ checkOnStart: enabled });
    const settings = await loadSettings();
    await saveSettings({ ...settings, updates: { checkOnStart: enabled } });
  },
}));

export async function initUpdater(): Promise<void> {
  try {
    const checkOnStart = readCheckOnStart((await loadSettings()).updates);
    useUpdaterStore.setState({ checkOnStart });
    if (checkOnStart) {
      await useUpdaterStore.getState().check(false);
    }
  } catch {
    return;
  }
}
