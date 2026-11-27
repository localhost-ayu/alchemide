import { create } from "zustand";
import { loadSettings, saveSettings } from "../../lib/ipc";

type MascotLock = { locked: boolean };

export const useMascotLock = create<MascotLock>(() => ({ locked: true }));

function show(locked: boolean): void {
  document.documentElement.dataset.mascotLocked = String(locked);
}

export async function setMascotLocked(locked: boolean): Promise<void> {
  useMascotLock.setState({ locked });
  show(locked);
  try {
    const settings = await loadSettings();
    await saveSettings({ ...settings, mascotLocked: locked });
  } catch {
    return;
  }
}

export async function initMascotLock(): Promise<void> {
  try {
    const { mascotLocked } = await loadSettings();
    const locked = typeof mascotLocked === "boolean" ? mascotLocked : true;
    useMascotLock.setState({ locked });
    show(locked);
  } catch {
    show(true);
  }
}
