import { create } from "zustand";
import { useActivityStore } from "../../lib/activityStore";
import { listDir, openFolder, reopenLastFolder } from "../../lib/ipc";
import type { Entry, Folder } from "../../lib/types";

type WorkspaceState = {
  folder: Folder | null;
  children: Record<string, Entry[]>;
  expanded: Record<string, boolean>;
  selected: string | null;
  error: string | null;
  pickFolder: () => Promise<void>;
  restoreLastFolder: () => Promise<void>;
  loadDir: (path: string) => Promise<void>;
  toggleDir: (path: string) => Promise<void>;
  select: (path: string) => void;
  refreshDirs: (dirs: string[]) => Promise<void>;
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  folder: null,
  children: {},
  expanded: {},
  selected: null,
  error: null,
  pickFolder: () => showFolder(openFolder),
  restoreLastFolder: () => showFolder(reopenLastFolder),
  loadDir: async (path) => {
    try {
      const entries = await useActivityStore.getState().track(listDir(path));
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
  refreshDirs: async (dirs) => {
    const loaded = dirs.filter((dir) => get().children[dir]);
    await Promise.all(loaded.map(refreshDir));
  },
}));

async function refreshDir(path: string): Promise<void> {
  try {
    const entries = await listDir(path);
    useWorkspaceStore.setState((state) => ({ children: { ...state.children, [path]: entries } }));
  } catch {
    useWorkspaceStore.setState((state) => {
      const { [path]: _removed, ...children } = state.children;
      return { children };
    });
  }
}

async function showFolder(open: () => Promise<Folder | null>): Promise<void> {
  try {
    const folder = await open();
    if (!folder) {
      return;
    }
    useWorkspaceStore.setState({ folder, children: {}, expanded: {}, selected: null, error: null });
    await useWorkspaceStore.getState().loadDir(folder.path);
  } catch (error) {
    useWorkspaceStore.setState({ error: String(error) });
  }
}
