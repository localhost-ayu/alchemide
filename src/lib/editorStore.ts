import { create } from "zustand";
import { readFile, writeFile } from "./ipc";
import { type LanguageId, languageForPath } from "./languages";
import { detectLineEnding, type LineEnding } from "./lineEndings";

export type Tab = {
  path: string;
  name: string;
  language: LanguageId;
  text: string;
  hasBom: boolean;
  lineEnding: LineEnding;
  dirty: boolean;
};

export type Cursor = {
  line: number;
  column: number;
  lineCount: number;
};

type EditorState = {
  tabs: Tab[];
  activePath: string | null;
  cursor: Cursor | null;
  drafts: Record<string, string>;
  scroll: number;
  error: string | null;
  openFile: (path: string) => Promise<void>;
  activate: (path: string) => void;
  closeTab: (path: string) => void;
  setDirty: (path: string, dirty: boolean) => void;
  setCursor: (cursor: Cursor) => void;
  setDraft: (path: string, text: string) => void;
  setScroll: (fraction: number) => void;
  saveFile: (path: string, text: string) => Promise<void>;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activePath: null,
  cursor: null,
  drafts: {},
  scroll: 0,
  error: null,
  openFile: async (path) => {
    if (get().tabs.some((tab) => tab.path === path)) {
      set({ activePath: path });
      return;
    }
    try {
      const { text, hasBom } = await readFile(path);
      const tab: Tab = {
        path,
        name: path.split(/[\\/]/).pop() ?? path,
        language: languageForPath(path),
        text,
        hasBom,
        lineEnding: detectLineEnding(text),
        dirty: false,
      };
      set((state) => ({ tabs: [...state.tabs, tab], activePath: path, error: null }));
    } catch (error) {
      set({ error: String(error) });
    }
  },
  activate: (path) => set({ activePath: path }),
  closeTab: (path) =>
    set((state) => {
      const index = state.tabs.findIndex((tab) => tab.path === path);
      const tabs = state.tabs.filter((tab) => tab.path !== path);
      const { [path]: _closed, ...drafts } = state.drafts;
      if (state.activePath !== path) {
        return { tabs, drafts };
      }
      const next = tabs[Math.min(index, tabs.length - 1)];
      return { tabs, drafts, activePath: next?.path ?? null, cursor: next ? state.cursor : null };
    }),
  setDirty: (path, dirty) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.path === path && tab.dirty !== dirty ? { ...tab, dirty } : tab,
      ),
    })),
  setCursor: (cursor) => set({ cursor }),
  setDraft: (path, text) => set((state) => ({ drafts: { ...state.drafts, [path]: text } })),
  setScroll: (fraction) => set({ scroll: Math.min(Math.max(fraction, 0), 1) }),
  saveFile: async (path, text) => {
    const tab = get().tabs.find((candidate) => candidate.path === path);
    if (!tab) {
      return;
    }
    try {
      await writeFile(path, text, tab.hasBom);
      set((state) => ({
        tabs: state.tabs.map((candidate) =>
          candidate.path === path ? { ...candidate, text, dirty: false } : candidate,
        ),
        error: null,
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },
}));

export function selectActiveTab(state: EditorState): Tab | null {
  return state.tabs.find((tab) => tab.path === state.activePath) ?? null;
}

export function hasUnsavedTabs(): boolean {
  return useEditorStore.getState().tabs.some((tab) => tab.dirty);
}

export function selectActiveText(state: EditorState): string | null {
  const tab = selectActiveTab(state);
  return tab ? (state.drafts[tab.path] ?? tab.text) : null;
}
