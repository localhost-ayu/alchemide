import { create } from "zustand";

export const MESSAGE_DURATION_MS = 4000;

type Message = { id: number; text: string };

type ActivityState = {
  busy: number;
  message: Message | null;
  track: <T>(work: Promise<T>) => Promise<T>;
  notify: (text: string) => void;
};

let nextId = 1;

export const useActivityStore = create<ActivityState>((set, get) => ({
  busy: 0,
  message: null,
  track: async (work) => {
    set((state) => ({ busy: state.busy + 1 }));
    try {
      return await work;
    } finally {
      set((state) => ({ busy: state.busy - 1 }));
    }
  },
  notify: (text) => {
    const message = { id: nextId++, text };
    set({ message });
    setTimeout(() => {
      if (get().message?.id === message.id) {
        set({ message: null });
      }
    }, MESSAGE_DURATION_MS);
  },
}));

export function playfulTouchesEnabled(root: HTMLElement = document.documentElement): boolean {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  return root.dataset.animations !== "false" && !reducedMotion;
}
