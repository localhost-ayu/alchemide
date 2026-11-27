import { create } from "zustand";
import type { LanguageId } from "./languages";

export type ServerStatus =
  | { kind: "starting" }
  | { kind: "ready"; name: string }
  | { kind: "missing"; name: string; install: string }
  | { kind: "stopped"; name: string }
  | { kind: "error"; message: string };

type LanguageServerState = {
  statuses: Partial<Record<LanguageId, ServerStatus>>;
  generation: number;
  setStatus: (language: LanguageId, status: ServerStatus | null) => void;
  restarted: () => void;
};

export const useLanguageServerStore = create<LanguageServerState>((set) => ({
  statuses: {},
  generation: 0,
  setStatus: (language, status) =>
    set((state) => {
      const statuses = { ...state.statuses };
      if (status) {
        statuses[language] = status;
      } else {
        delete statuses[language];
      }
      return { statuses };
    }),
  restarted: () => set((state) => ({ statuses: {}, generation: state.generation + 1 })),
}));
