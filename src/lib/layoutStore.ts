import { create } from "zustand";
import { loadSettings, saveSettings } from "./ipc";

export const SIDEBAR_VIEWS = ["explorer", "search", "docker"] as const;

export type SidebarView = (typeof SIDEBAR_VIEWS)[number];

export type Layout = {
  sidebar: SidebarView;
  sidebarOpen: boolean;
  activityBar: boolean;
  statusBar: boolean;
  tabs: boolean;
  sidebarWidth: number;
  terminalHeight: number;
};

export const SIDEBAR_WIDTH = { min: 160, max: 600, default: 260 };
export const TERMINAL_HEIGHT = { min: 120, max: 900, default: 260 };

export function clampSize(value: number, limits: { min: number; max: number }): number {
  return Math.round(Math.min(limits.max, Math.max(limits.min, value)));
}

export const DEFAULT_LAYOUT: Layout = {
  sidebar: "explorer",
  sidebarOpen: true,
  activityBar: true,
  statusBar: true,
  tabs: true,
  sidebarWidth: SIDEBAR_WIDTH.default,
  terminalHeight: TERMINAL_HEIGHT.default,
};

export function readLayout(raw: unknown): Layout {
  const fields = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const flag = (key: keyof Layout) =>
    typeof fields[key] === "boolean" ? (fields[key] as boolean) : (DEFAULT_LAYOUT[key] as boolean);
  const size = (key: "sidebarWidth" | "terminalHeight", limits: { min: number; max: number }) =>
    typeof fields[key] === "number" && Number.isFinite(fields[key])
      ? clampSize(fields[key] as number, limits)
      : DEFAULT_LAYOUT[key];
  return {
    sidebar: SIDEBAR_VIEWS.find((view) => view === fields.sidebar) ?? DEFAULT_LAYOUT.sidebar,
    sidebarOpen: flag("sidebarOpen"),
    activityBar: flag("activityBar"),
    statusBar: flag("statusBar"),
    tabs: flag("tabs"),
    sidebarWidth: size("sidebarWidth", SIDEBAR_WIDTH),
    terminalHeight: size("terminalHeight", TERMINAL_HEIGHT),
  };
}

type LayoutState = Layout & {
  zen: boolean;
  update: (changes: Partial<Layout>) => Promise<void>;
  preview: (changes: Partial<Layout>) => void;
  showView: (view: SidebarView) => Promise<void>;
  toggleView: (view: SidebarView) => Promise<void>;
  toggleZen: () => void;
};

function layoutOf(state: Layout): Layout {
  return readLayout(state);
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  ...DEFAULT_LAYOUT,
  zen: false,
  update: async (changes) => {
    const next = readLayout({ ...layoutOf(get()), ...changes });
    set(next);
    try {
      const settings = await loadSettings();
      await saveSettings({ ...settings, layout: next });
    } catch {
      return;
    }
  },
  preview: (changes) => set(readLayout({ ...layoutOf(get()), ...changes })),
  showView: (view) => {
    set({ zen: false });
    return get().update({ sidebar: view, sidebarOpen: true });
  },
  toggleView: (view) => {
    const { sidebar, sidebarOpen, zen } = get();
    if (sidebar === view && sidebarOpen && !zen) {
      return get().update({ sidebarOpen: false });
    }
    return get().showView(view);
  },
  toggleZen: () => set((state) => ({ zen: !state.zen })),
}));

export async function initLayout(): Promise<void> {
  try {
    useLayoutStore.setState(readLayout((await loadSettings()).layout));
  } catch {
    return;
  }
}
