import { create } from "zustand";
import { useActivityStore } from "../../lib/activityStore";
import { useEditorStore } from "../../lib/editorStore";
import { createEntry, listDir, openFolder, reopenLastFolder } from "../../lib/ipc";
import type { Entry, Folder } from "../../lib/types";

export type Creating = { parent: string; isDir: boolean; error: string | null };

type WorkspaceState = {
  creating: Creating | null;
  startCreate: (isDir: boolean) => Promise<void>;
  cancelCreate: () => void;
  confirmCreate: (name: string) => Promise<void>;
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

export function parentOf(children: Record<string, Entry[]>, path: string): string | null {
  for (const [dir, entries] of Object.entries(children)) {
    if (entries.some((entry) => entry.path === path)) {
      return dir;
    }
  }
  return null;
}

function targetFolder(state: WorkspaceState): string | null {
  const { folder, selected, children } = state;
  if (!folder) {
    return null;
  }
  if (!selected) {
    return folder.path;
  }
  const isDir = selected === folder.path || children[selected] !== undefined;
  const entry = Object.values(children)
    .flat()
    .find((candidate) => candidate.path === selected);
  if (isDir || entry?.isDir) {
    return selected;
  }
  return parentOf(children, selected) ?? folder.path;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  creating: null,
  startCreate: async (isDir) => {
    const parent = targetFolder(get());
    if (!parent) {
      return;
    }
    if (parent !== get().folder?.path && !get().expanded[parent]) {
      await get().toggleDir(parent);
    }
    set({ creating: { parent, isDir, error: null } });
  },
  cancelCreate: () => set({ creating: null }),
  confirmCreate: async (name) => {
    const creating = get().creating;
    if (!creating || !name.trim()) {
      set({ creating: null });
      return;
    }
    try {
      const path = await createEntry(creating.parent, name, creating.isDir);
      set({ creating: null, selected: path });
      await refreshDir(creating.parent);
      if (!creating.isDir) {
        await useEditorStore.getState().openFile(path);
      }
    } catch (error) {
      set({ creating: { ...creating, error: String(error).replace(/^Error: /, "") } });
    }
  },
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
    useWorkspaceStore.setState({
      folder,
      children: {},
      expanded: {},
      selected: null,
      error: null,
      creating: null,
    });
    await useWorkspaceStore.getState().loadDir(folder.path);
  } catch (error) {
    useWorkspaceStore.setState({ error: String(error) });
  }
}
