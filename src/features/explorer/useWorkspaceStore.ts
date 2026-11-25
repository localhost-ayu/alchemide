import { create } from "zustand";
import { listDir, openFolder } from "../../lib/ipc";
import type { Entry, Folder } from "../../lib/types";

type WorkspaceState = {
  folder: Folder | null;
  children: Record<string, Entry[]>;
  expanded: Record<string, boolean>;
  selected: string | null;
  error: string | null;
  pickFolder: () => Promise<void>;
  loadDir: (path: string) => Promise<void>;
  toggleDir: (path: string) => Promise<void>;
  select: (path: string) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  folder: null,
  children: {},
  expanded: {},
  selected: null,
  error: null,
  pickFolder: async () => {
    try {
      const folder = await openFolder();
      if (!folder) {
        return;
      }
      set({ folder, children: {}, expanded: {}, selected: null, error: null });
      await get().loadDir(folder.path);
    } catch (error) {
      set({ error: String(error) });
    }
  },
  loadDir: async (path) => {
    try {
      const entries = await listDir(path);
      set((state) => ({ children: { ...state.children, [path]: entries } }));
    } catch (error) {
      set({ error: String(error) });
    }
  },
  toggleDir: async (path) => {
    const isOpen = get().expanded[path] ?? false;
    set((state) => ({ expanded: { ...state.expanded, [path]: !isOpen } }));
    if (!isOpen && !get().children[path]) {
      await get().loadDir(path);
    }
  },
  select: (path) => set({ selected: path }),
}));
