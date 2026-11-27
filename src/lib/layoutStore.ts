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
};

export const DEFAULT_LAYOUT: Layout = {
  sidebar: "explorer",
  sidebarOpen: true,
  activityBar: true,
  statusBar: true,
  tabs: true,
};

export function readLayout(raw: unknown): Layout {
  const fields = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const flag = (key: keyof Layout) =>
    typeof fields[key] === "boolean" ? (fields[key] as boolean) : (DEFAULT_LAYOUT[key] as boolean);
  return {
    sidebar: SIDEBAR_VIEWS.find((view) => view === fields.sidebar) ?? DEFAULT_LAYOUT.sidebar,
    sidebarOpen: flag("sidebarOpen"),
    activityBar: flag("activityBar"),
    statusBar: flag("statusBar"),
    tabs: flag("tabs"),
  };
}

type LayoutState = Layout & {
  zen: boolean;
  update: (changes: Partial<Layout>) => Promise<void>;
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
