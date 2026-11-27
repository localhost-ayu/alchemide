import { type KeyOverrides, useCommandStore } from "./commands";
import { loadSettings, saveSettings } from "./ipc";

const STROKE = String.raw`(?:Ctrl\+)?(?:Alt\+)?(?:Shift\+)?[^\s+]+|(?:Ctrl\+)?(?:Alt\+)?(?:Shift\+)?\+`;
const KEYS = new RegExp(`^(?:${STROKE})(?: (?:${STROKE}))?$`);

export function isValidKeys(keys: string): boolean {
  return KEYS.test(keys);
}

export function readOverrides(raw: unknown): KeyOverrides {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {};
  }
  const overrides: KeyOverrides = {};
  for (const [id, keys] of Object.entries(raw as Record<string, unknown>)) {
    if (keys === null || (typeof keys === "string" && isValidKeys(keys))) {
      overrides[id] = keys;
    }
  }
  return overrides;
}

async function save(overrides: KeyOverrides): Promise<void> {
  useCommandStore.setState({ overrides });
  try {
    const settings = await loadSettings();
    await saveSettings({ ...settings, keybindings: overrides });
  } catch {
    return;
  }
}

export function setShortcut(id: string, keys: string | null): Promise<void> {
  return save({ ...useCommandStore.getState().overrides, [id]: keys });
}

export function resetShortcut(id: string): Promise<void> {
  const { [id]: _removed, ...rest } = useCommandStore.getState().overrides;
  return save(rest);
}

export async function initKeybindings(): Promise<void> {
  try {
    useCommandStore.setState({ overrides: readOverrides((await loadSettings()).keybindings) });
  } catch {
    return;
  }
}
