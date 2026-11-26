import { create } from "zustand";
import { terminalClose, terminalOpen } from "../../lib/ipc";

export type TerminalTab = {
  id: number;
  label: string;
};

type TerminalState = {
  isOpen: boolean;
  tabs: TerminalTab[];
  activeId: number | null;
  error: string | null;
  toggle: () => Promise<void>;
  openTab: (profile: string | null, label: string) => Promise<void>;
  closeTab: (id: number) => Promise<void>;
  removeTab: (id: number) => void;
  activate: (id: number) => void;
};

const INITIAL_SIZE = { cols: 80, rows: 24 };

export const useTerminalStore = create<TerminalState>((set, get) => ({
  isOpen: false,
  tabs: [],
  activeId: null,
  error: null,
  toggle: async () => {
    const opening = !get().isOpen;
    set({ isOpen: opening });
    if (opening && get().tabs.length === 0) {
      await get().openTab(null, "Terminal");
    }
  },
  openTab: async (profile, label) => {
    try {
      const id = await terminalOpen(profile, INITIAL_SIZE.cols, INITIAL_SIZE.rows);
      set((state) => ({
        tabs: [...state.tabs, { id, label }],
        activeId: id,
        isOpen: true,
        error: null,
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },
  closeTab: async (id) => {
    get().removeTab(id);
    await terminalClose(id).catch(() => {});
  },
  removeTab: (id) =>
    set((state) => {
      const index = state.tabs.findIndex((tab) => tab.id === id);
      if (index === -1) {
        return {};
      }
      const tabs = state.tabs.filter((tab) => tab.id !== id);
      const next = tabs[Math.min(index, tabs.length - 1)];
      const activeId = state.activeId === id ? (next?.id ?? null) : state.activeId;
      return { tabs, activeId, isOpen: tabs.length > 0 && state.isOpen };
    }),
  activate: (id) => set({ activeId: id }),
}));
