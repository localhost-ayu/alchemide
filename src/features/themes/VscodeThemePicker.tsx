import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useState } from "react";
import { registerCommands } from "../../lib/commands";
import { useDismiss } from "../../lib/dismiss";
import { listVscodeThemes } from "../../lib/ipc";
import type { VscodeTheme } from "../../lib/types";
import { importVscodeTheme, importVscodeThemeFile } from "./themeLibrary";
import { useThemeStore } from "./useThemeStore";

function matches(theme: VscodeTheme, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return (
    theme.label.toLowerCase().includes(needle) || theme.extension.toLowerCase().includes(needle)
  );
}

export function VscodeThemePicker() {
  const [themes, setThemes] = useState<VscodeTheme[] | null>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const options = useMemo(
    () => (themes ?? []).filter((theme) => matches(theme, query)),
    [themes, query],
  );
  const highlighted = options[Math.min(index, options.length - 1)];

  useEffect(
    () =>
      registerCommands([
        {
          id: "themes.importVscode",
          title: "Import VS Code theme…",
          run: async () => {
            try {
              const found = await listVscodeThemes();
              if (found.length === 0) {
                useThemeStore.setState({
                  warnings: ["no VS Code themes were found; try Import VS Code theme file…"],
                });
                return;
              }
              setQuery("");
              setIndex(0);
              setThemes(found);
            } catch (error) {
              useThemeStore.setState({ warnings: [String(error)] });
            }
          },
        },
        {
          id: "themes.importVscodeFile",
          title: "Import VS Code theme file…",
          run: importVscodeThemeFile,
        },
      ]),
    [],
  );

  const close = () => setThemes(null);
  useDismiss(themes !== null, close);

  if (!themes) {
    return null;
  }

  const choose = (theme: VscodeTheme | undefined) => {
    if (!theme) {
      return;
    }
    close();
    importVscodeTheme(theme);
  };

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    const count = Math.max(options.length, 1);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex((current) => (current + 1) % count);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex((current) => (current - 1 + count) % count);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(highlighted);
    }
  };

  return (
    <div className="mood-picker__overlay">
      <div className="mood-picker panel" role="dialog" aria-label="Import a VS Code theme">
        <input
          className="mood-picker__search"
          role="combobox"
          aria-expanded="true"
          aria-controls="vscode-theme-options"
          aria-activedescendant={highlighted ? `vscode-theme-${index}` : undefined}
          aria-label="Search VS Code themes"
          placeholder="VS Code theme"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIndex(0);
          }}
          onKeyDown={handleKeyDown}
          onBlur={close}
          // biome-ignore lint/a11y/noAutofocus: the picker opens from a command and must take focus
          autoFocus
        />
        <div id="vscode-theme-options" className="mood-picker__list" role="listbox">
          {options.map((theme, position) => (
            <div
              key={theme.path}
              id={`vscode-theme-${position}`}
              role="option"
              tabIndex={-1}
              aria-selected={theme === highlighted}
              className="mood-picker__option"
              onMouseEnter={() => setIndex(position)}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(theme);
              }}
            >
              <span>{theme.label}</span>
              <span className="mood-picker__group">
                {theme.dark ? "dark" : "light"} · {theme.extension}
              </span>
            </div>
          ))}
          {options.length === 0 && <p className="mood-picker__empty">No match</p>}
        </div>
      </div>
    </div>
  );
}
