import { create } from "zustand";

type PreviewState = {
  isOpen: boolean;
  toggle: () => void;
};

export const usePreviewStore = create<PreviewState>((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
