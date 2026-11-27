import { create } from "zustand";
import { dockerAction, dockerContainers } from "../../lib/ipc";
import type { ContainerAction, DockerContainer } from "../../lib/types";

type DockerState = {
  containers: DockerContainer[];
  error: string | null;
  loaded: boolean;
  pending: Record<string, ContainerAction>;
  refresh: () => Promise<void>;
  run: (id: string, action: ContainerAction) => Promise<void>;
};

export const useDockerStore = create<DockerState>((set, get) => ({
  containers: [],
  error: null,
  loaded: false,
  pending: {},
  refresh: async () => {
    try {
      const containers = await dockerContainers();
      set({ containers, error: null, loaded: true });
    } catch (error) {
      set({ containers: [], error: String(error), loaded: true });
    }
  },
  run: async (id, action) => {
    set((state) => ({ pending: { ...state.pending, [id]: action } }));
    try {
      await dockerAction(id, action);
      await get().refresh();
    } catch (error) {
      set({ error: String(error) });
    } finally {
      set((state) => {
        const { [id]: _done, ...pending } = state.pending;
        return { pending };
      });
    }
  },
}));
