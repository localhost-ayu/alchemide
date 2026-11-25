import { create } from "zustand";
import { readFile } from "./ipc";
import { type LanguageId, languageForPath } from "./languages";

export type OpenFile = {
  path: string;
  name: string;
  language: LanguageId;
  text: string;
  hasBom: boolean;
};

type EditorState = {
  active: OpenFile | null;
  error: string | null;
  openFile: (path: string) => Promise<void>;
};

export const useEditorStore = create<EditorState>((set) => ({
  active: null,
  error: null,
  openFile: async (path) => {
    try {
      const content = await readFile(path);
      const name = path.split(/[\\/]/).pop() ?? path;
      set({
        active: { path, name, language: languageForPath(path), ...content },
        error: null,
      });
    } catch (error) {
      set({ error: String(error) });
    }
  },
}));
