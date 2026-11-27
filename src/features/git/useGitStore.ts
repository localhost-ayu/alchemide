import { create } from "zustand";
import { useActivityStore } from "../../lib/activityStore";
import {
  gitCommit,
  gitDiff,
  gitLog,
  gitShow,
  gitStage,
  gitStageAll,
  gitStatus,
  gitUnstage,
} from "../../lib/ipc";
import type { ChangedFile, Commit, GitStatus } from "../../lib/types";

export type GitTab = "changes" | "history";

export type GitSelection =
  | { kind: "file"; path: string; staged: boolean; untracked: boolean }
  | { kind: "commit"; hash: string };

type GitState = {
  open: boolean;
  tab: GitTab;
  status: GitStatus | null;
  log: Commit[];
  selection: GitSelection | null;
  diff: string | null;
  message: string;
  error: string | null;
  toggle: () => void;
  setTab: (tab: GitTab) => void;
  setMessage: (message: string) => void;
  refresh: () => Promise<void>;
  showFile: (file: ChangedFile, staged: boolean) => Promise<void>;
  showCommit: (commit: Commit) => Promise<void>;
  stage: (file: ChangedFile) => Promise<void>;
  unstage: (file: ChangedFile) => Promise<void>;
  stageAll: () => Promise<void>;
  commit: () => Promise<void>;
};

function errorText(error: unknown): string {
  return String(error).replace(/^Error: /, "");
}

export const useGitStore = create<GitState>((set, get) => {
  const act = async (work: () => Promise<unknown>) => {
    try {
      await useActivityStore.getState().track(work());
      set({ error: null });
    } catch (error) {
      set({ error: errorText(error) });
    }
    await get().refresh();
  };

  return {
    open: false,
    tab: "changes",
    status: null,
    log: [],
    selection: null,
    diff: null,
    message: "",
    error: null,
    toggle: () => {
      const open = !get().open;
      set({ open });
      if (open) {
        void get().refresh();
      }
    },
    setTab: (tab) => set({ tab, selection: null, diff: null }),
    setMessage: (message) => set({ message }),
    refresh: async () => {
      try {
        const [status, log] = await Promise.all([gitStatus(), gitLog()]);
        set({ status, log, error: null });
      } catch (error) {
        set({ status: null, log: [], error: errorText(error) });
      }
    },
    showFile: async (file, staged) => {
      const untracked = file.unstaged === "?";
      set({ selection: { kind: "file", path: file.path, staged, untracked }, diff: null });
      try {
        set({ diff: await gitDiff(file.path, staged, untracked) });
      } catch (error) {
        set({ error: errorText(error) });
      }
    },
    showCommit: async (commit) => {
      set({ selection: { kind: "commit", hash: commit.hash }, diff: null });
      try {
        set({ diff: await gitShow(commit.hash) });
      } catch (error) {
        set({ error: errorText(error) });
      }
    },
    stage: (file) => act(() => gitStage([file.path])),
    unstage: (file) => act(() => gitUnstage([file.path])),
    stageAll: () => act(() => gitStageAll()),
    commit: async () => {
      const message = get().message;
      try {
        const hash = await useActivityStore.getState().track(gitCommit(message));
        set({ message: "", selection: null, diff: null, error: null });
        useActivityStore.getState().notify(`Committed ${hash}`);
      } catch (error) {
        set({ error: errorText(error) });
      }
      await get().refresh();
    },
  };
});
