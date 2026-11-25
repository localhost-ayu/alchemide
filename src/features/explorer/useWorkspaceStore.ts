import { create } from "zustand";
import { openFolder } from "../../lib/ipc";
import type { Folder } from "../../lib/types";

type WorkspaceState = {
  folder: Folder | null;
  error: string | null;
  pickFolder: () => Promise<void>;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  folder: null,
  error: null,
  pickFolder: async () => {
    try {
      const folder = await openFolder();
      if (folder) {
        set({ folder, error: null });
      }
    } catch (error) {
      set({ error: String(error) });
    }
  },
}));
