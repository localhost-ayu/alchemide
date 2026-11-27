import { type Command, effectiveKeys, type KeyOverrides } from "../lib/commands";
import type { MessageKey } from "../lib/i18n";

export type MenuItem = { id: string; title: string; keys?: string };

export type Menu = { label: string; items: MenuItem[] };

export const MENU_ORDER = ["File", "Edit", "View", "Go", "Terminal", "Git", "Theme", "Help"];

const CATEGORIES: Record<string, string> = {
  explorer: "File",
  editor: "File",
  settings: "File",
  search: "Edit",
  snippets: "Edit",
  view: "View",
  markdown: "View",
  docker: "View",
  palette: "Go",
  terminal: "Terminal",
  git: "Git",
  themes: "Theme",
  updates: "Help",
};

const MENU_KEYS: Record<string, MessageKey> = {
  File: "menu.File",
  Edit: "menu.Edit",
  View: "menu.View",
  Go: "menu.Go",
  Terminal: "menu.Terminal",
  Git: "menu.Git",
  Theme: "menu.Theme",
  Help: "menu.Help",
};

export function menuKey(label: string): MessageKey {
  return MENU_KEYS[label] ?? "menu.More";
}

export function menuOf(id: string): string {
  return CATEGORIES[id.split(".")[0] ?? ""] ?? "More";
}

export function buildMenus(commands: Command[], overrides: KeyOverrides): Menu[] {
  const byMenu = new Map<string, MenuItem[]>();
  for (const command of commands) {
    const label = menuOf(command.id);
    const item = { id: command.id, title: command.title, keys: effectiveKeys(command, overrides) };
    byMenu.set(label, [...(byMenu.get(label) ?? []), item]);
  }
  const labels = [...MENU_ORDER, "More"].filter((label) => byMenu.has(label));
  return labels.map((label) => ({
    label,
    items: (byMenu.get(label) ?? []).sort((a, b) => a.title.localeCompare(b.title)),
  }));
}
