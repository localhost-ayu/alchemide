import { create } from "zustand";
import { useActivityStore } from "../../lib/activityStore";
import { useEditorStore } from "../../lib/editorStore";
import { t } from "../../lib/i18n";
import {
  createEntry,
  deleteEntry,
  listDir,
  openFolder,
  renameEntry,
  reopenLastFolder,
} from "../../lib/ipc";
import type { Entry, Folder } from "../../lib/types";

export type Creating = { parent: string; isDir: boolean; error: string | null };

export type Renaming = { path: string; error: string | null };

export type ContextMenu = { path: string; x: number; y: number };

type WorkspaceState = {
  renaming: Renaming | null;
  contextMenu: ContextMenu | null;
  startRename: (path?: string) => void;
  cancelRename: () => void;
  confirmRename: (name: string) => Promise<void>;
  deletePath: (path?: string) => Promise<void>;
  openContextMenu: (menu: ContextMenu) => void;
  closeContextMenu: () => void;
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

export function isUnder(candidate: string, path: string): boolean {
  return (
    candidate === path || candidate.startsWith(`${path}/`) || candidate.startsWith(`${path}\\`)
  );
}

function nameOf(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

function forgetUnder(record: Record<string, unknown>, path: string) {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !isUnder(key, path)));
}

function errorText(error: unknown): string {
  return String(error).replace(/^Error: /, "");
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  renaming: null,
  contextMenu: null,
  openContextMenu: (menu) => set({ contextMenu: menu, selected: menu.path }),
  closeContextMenu: () => set({ contextMenu: null }),
  startRename: (path = get().selected ?? undefined) => {
    if (path && path !== get().folder?.path) {
      set({ renaming: { path, error: null }, contextMenu: null });
    }
  },
  cancelRename: () => set({ renaming: null }),
  confirmRename: async (name) => {
    const renaming = get().renaming;
    if (!renaming || !name.trim() || name.trim() === nameOf(renaming.path)) {
      set({ renaming: null });
      return;
    }
    const editor = useEditorStore.getState();
    const affected = editor.tabs.filter((tab) => isUnder(tab.path, renaming.path));
    const dirty = affected.find((tab) => tab.dirty);
    if (dirty) {
      set({
        renaming: { ...renaming, error: t("explorer.saveOrCloseFirst", { name: dirty.name }) },
      });
      return;
    }
    try {
      const renamed = await renameEntry(renaming.path, name);
      const parent = parentOf(get().children, renaming.path);
      set((state) => ({
        renaming: null,
        selected: renamed,
        children: forgetUnder(state.children, renaming.path) as Record<string, Entry[]>,
        expanded: forgetUnder(state.expanded, renaming.path) as Record<string, boolean>,
      }));
      if (parent) {
        await refreshDir(parent);
      }
      const active = editor.activePath;
      for (const tab of affected) {
        editor.closeTab(tab.path);
        await useEditorStore.getState().openFile(renamed + tab.path.slice(renaming.path.length));
      }
      const stillOpen = active && !isUnder(active, renaming.path);
      if (stillOpen && affected.length > 0) {
        useEditorStore.getState().activate(active);
      }
    } catch (error) {
      set({ renaming: { ...renaming, error: errorText(error) } });
    }
  },
  deletePath: async (path = get().selected ?? undefined) => {
    set({ contextMenu: null });
    if (!path || path === get().folder?.path) {
      return;
    }
    const isDir =
      get().children[path] !== undefined ||
      get().expanded[path] !== undefined ||
      Object.values(get().children)
        .flat()
        .some((entry) => entry.path === path && entry.isDir);
    const affected = useEditorStore.getState().tabs.filter((tab) => isUnder(tab.path, path));
    const question = [
      t("explorer.confirmTrash", { name: nameOf(path) }),
      isDir ? t("explorer.confirmTrashFolder") : "",
      affected.some((tab) => tab.dirty) ? t("explorer.confirmTrashUnsaved") : "",
    ]
      .filter(Boolean)
      .join(" ");
    if (!window.confirm(question)) {
      return;
    }
    try {
      await deleteEntry(path);
      const parent = parentOf(get().children, path);
      for (const tab of affected) {
        useEditorStore.getState().closeTab(tab.path);
      }
      set((state) => ({
        selected: null,
        error: null,
        children: forgetUnder(state.children, path) as Record<string, Entry[]>,
        expanded: forgetUnder(state.expanded, path) as Record<string, boolean>,
      }));
      if (parent) {
        await refreshDir(parent);
      }
    } catch (error) {
      set({ error: errorText(error) });
    }
  },
  creating: null,
  startCreate: async (isDir) => {
    const parent = targetFolder(get());
    if (!parent) {
      return;
    }
    if (parent !== get().folder?.path && !get().expanded[parent]) {
      await get().toggleDir(parent);
    }
    set({ creating: { parent, isDir, error: null }, contextMenu: null });
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
      renaming: null,
      contextMenu: null,
    });
    await useWorkspaceStore.getState().loadDir(folder.path);
  } catch (error) {
    useWorkspaceStore.setState({ error: String(error) });
  }
}
