import { create } from "zustand";
import { useActivityStore } from "../../lib/activityStore";
import { useEditorStore } from "../../lib/editorStore";
import { onSearchDone, onSearchResults, replaceMatches, searchStart } from "../../lib/ipc";
import type { ReplaceTarget, SearchMatch, SearchQuery } from "../../lib/types";

export type SearchStatus = "idle" | "searching" | "done";

type SearchState = {
  query: SearchQuery;
  replacement: string;
  searchId: number;
  results: SearchMatch[];
  status: SearchStatus;
  truncated: boolean;
  error: string | null;
  excluded: Record<string, true>;
  setQuery: (changes: Partial<SearchQuery>) => void;
  setReplacement: (replacement: string) => void;
  run: () => Promise<void>;
  addResults: (id: number, matches: SearchMatch[]) => void;
  finish: (id: number, truncated: boolean) => void;
  toggleMatch: (match: SearchMatch) => void;
  replaceSelected: () => Promise<ReplaceOutcome>;
};

export type ReplaceOutcome = {
  replacements: number;
  files: number;
  skipped: string[];
};

export function matchKey(match: SearchMatch): string {
  return `${match.path}:${match.line}`;
}

export function groupByFile(
  matches: SearchMatch[],
): { path: string; relative: string; matches: SearchMatch[] }[] {
  const groups = new Map<string, { path: string; relative: string; matches: SearchMatch[] }>();
  for (const match of matches) {
    const group = groups.get(match.path) ?? {
      path: match.path,
      relative: match.relative,
      matches: [],
    };
    group.matches.push(match);
    groups.set(match.path, group);
  }
  return [...groups.values()];
}

export function replaceTargets(
  matches: SearchMatch[],
  excluded: Record<string, true>,
  unsavedPaths: Set<string>,
): { targets: ReplaceTarget[]; skipped: string[] } {
  const targets: ReplaceTarget[] = [];
  const skipped: string[] = [];
  for (const group of groupByFile(matches)) {
    const lines = group.matches
      .filter((match) => !excluded[matchKey(match)])
      .map((match) => match.line);
    if (lines.length === 0) {
      continue;
    }
    if (unsavedPaths.has(group.path)) {
      skipped.push(group.relative);
    } else {
      targets.push({ path: group.path, lines });
    }
  }
  return { targets, skipped };
}

let nextSearchId = 1;

export const useSearchStore = create<SearchState>((set, get) => ({
  query: { text: "", regex: false, caseSensitive: false },
  replacement: "",
  searchId: 0,
  results: [],
  status: "idle",
  truncated: false,
  error: null,
  excluded: {},
  setQuery: (changes) => set((state) => ({ query: { ...state.query, ...changes } })),
  setReplacement: (replacement) => set({ replacement }),
  run: async () => {
    const id = nextSearchId++;
    set({
      searchId: id,
      results: [],
      excluded: {},
      status: "searching",
      truncated: false,
      error: null,
    });
    if (!get().query.text) {
      set({ status: "idle" });
      return;
    }
    try {
      await searchStart(id, get().query);
    } catch (error) {
      set({ status: "idle", error: String(error) });
    }
  },
  addResults: (id, matches) => {
    if (id === get().searchId) {
      set((state) => ({ results: [...state.results, ...matches] }));
    }
  },
  finish: (id, truncated) => {
    if (id === get().searchId) {
      set({ status: "done", truncated });
    }
  },
  toggleMatch: (match) =>
    set((state) => {
      const key = matchKey(match);
      const { [key]: wasExcluded, ...rest } = state.excluded;
      return { excluded: wasExcluded ? rest : { ...rest, [key]: true } };
    }),
  replaceSelected: async () => {
    const { query, replacement, results, excluded } = get();
    const unsaved = new Set(
      useEditorStore
        .getState()
        .tabs.filter((tab) => tab.dirty)
        .map((tab) => tab.path),
    );
    const { targets, skipped } = replaceTargets(results, excluded, unsaved);
    const { track, notify } = useActivityStore.getState();
    const summary = await track(replaceMatches(query, replacement, targets));
    const editor = useEditorStore.getState();
    await Promise.all(targets.map((target) => editor.reloadTab(target.path)));
    notify(`Replaced ${summary.replacements} in ${summary.files} files`);
    await get().run();
    return { ...summary, skipped };
  },
}));

export function connectSearchEvents(): () => void {
  const results = onSearchResults(({ id, matches }) =>
    useSearchStore.getState().addResults(id, matches),
  );
  const done = onSearchDone(({ id, truncated }) => useSearchStore.getState().finish(id, truncated));
  return () => {
    results.then((unsubscribe) => unsubscribe());
    done.then((unsubscribe) => unsubscribe());
  };
}
