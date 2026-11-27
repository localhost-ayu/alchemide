import { create } from "zustand";

export type DiffLayout = "split" | "unified";

type ChangesState = {
  open: boolean;
  layout: DiffLayout;
  show: () => void;
  hide: () => void;
  setLayout: (layout: DiffLayout) => void;
};

export const useChangesStore = create<ChangesState>((set) => ({
  open: false,
  layout: "split",
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
  setLayout: (layout) => set({ layout }),
}));
