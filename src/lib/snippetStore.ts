import { create } from "zustand";
import { importVscodeSnippets, listUserSnippets, loadSettings, saveSettings } from "./ipc";
import { DEFAULT_PACKS, SNIPPET_PACKS } from "./snippetPacks";
import { readSnippetFile, type Snippet } from "./snippets";
import type { SnippetImport } from "./types";

type SnippetState = {
  enabledPacks: string[];
  userSnippets: Snippet[];
  problems: string[];
  snippets: Snippet[];
  load: () => Promise<void>;
  setPack: (id: string, enabled: boolean) => Promise<void>;
  importFromVscode: () => Promise<SnippetImport>;
};

export function readEnabledPacks(raw: unknown): string[] {
  const packs = (raw as { packs?: unknown } | null)?.packs;
  if (!Array.isArray(packs)) {
    return DEFAULT_PACKS;
  }
  return packs.filter(
    (id): id is string => typeof id === "string" && SNIPPET_PACKS.some((pack) => pack.id === id),
  );
}

function combine(enabledPacks: string[], userSnippets: Snippet[]): Snippet[] {
  const packs = SNIPPET_PACKS.filter((pack) => enabledPacks.includes(pack.id));
  return [...userSnippets, ...packs.flatMap((pack) => pack.snippets)];
}

export const useSnippetStore = create<SnippetState>((set, get) => ({
  enabledPacks: DEFAULT_PACKS,
  userSnippets: [],
  problems: [],
  snippets: combine(DEFAULT_PACKS, []),
  load: async () => {
    const [settings, files] = await Promise.all([loadSettings(), listUserSnippets()]);
    const enabledPacks = readEnabledPacks(settings.snippets);
    const results = files.map(({ file, content }) => readSnippetFile(file, content));
    const userSnippets = results.flatMap((result) => result.snippets);
    const problems = results.flatMap((result) => (result.problem ? [result.problem] : []));
    set({ enabledPacks, userSnippets, problems, snippets: combine(enabledPacks, userSnippets) });
  },
  setPack: async (id, enabled) => {
    const current = get().enabledPacks.filter((pack) => pack !== id);
    const enabledPacks = enabled ? [...current, id] : current;
    set({ enabledPacks, snippets: combine(enabledPacks, get().userSnippets) });
    const settings = await loadSettings();
    await saveSettings({ ...settings, snippets: { packs: enabledPacks } });
  },
  importFromVscode: async () => {
    const result = await importVscodeSnippets();
    await get().load();
    return result;
  },
}));
