import { useEffect, useState } from "react";
import { registerCommands } from "../../lib/commands";
import { useDismiss } from "../../lib/dismiss";
import { DEFAULT_THEME } from "./builtinThemes";
import { ColorField } from "./ColorField";
import type { Look } from "./customLook";
import { LookFields } from "./LookFields";
import { addRecentColors, changedColors, loadRecentColors } from "./recentColors";
import { ShapeFields } from "./ShapeFields";
import { StartingPoints } from "./StartingPoints";
import { applyStartingPoint } from "./startingPoint";
import type { Theme, ThemeSyntax, ThemeUi } from "./theme";
import { currentUserTheme, saveEditedTheme } from "./themeLibrary";
import { nameKey, nameProblem, uniqueName } from "./userThemes";
import { allThemes, useThemeStore } from "./useThemeStore";

type Session = {
  look: Look;
  original: Look;
  file: string | null;
  taken: string[];
};

const SUGGESTIONS_ID = "theme-editor-colors";

const UI_FIELDS: [keyof ThemeUi, string][] = [
  ["bg", "Background"],
  ["panel", "Panels"],
  ["text", "Text"],
  ["accent", "Accent"],
  ["accent2", "Second accent"],
];

const SYNTAX_FIELDS: [keyof ThemeSyntax, string][] = [
  ["keyword", "Keywords"],
  ["string", "Strings"],
  ["function", "Functions"],
  ["variable", "Variables"],
  ["type", "Types"],
  ["number", "Numbers"],
  ["comment", "Comments"],
];

function startSession(): Session {
  const { theme: chosen, effects, custom, userThemes } = useThemeStore.getState();
  const theme = { ...chosen, effects: { ...chosen.effects, surface: effects.surface } };
  const userTheme = currentUserTheme();
  const taken = allThemes(userThemes)
    .map(({ name }) => name)
    .filter((name) => !userTheme || nameKey(name) !== nameKey(userTheme.theme.name));
  const name = userTheme ? theme.name : uniqueName(`${theme.name} copy`, taken);
  return {
    look: { theme: { ...theme, name }, custom },
    original: { theme, custom },
    file: userTheme?.file ?? null,
    taken,
  };
}

function preview({ theme, custom }: Look): void {
  const { effects } = useThemeStore.getState();
  useThemeStore.getState().preview(theme, { ...effects, surface: theme.effects.surface }, custom);
}

export function ThemeEditor() {
  const [session, setSession] = useState<Session | null>(null);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  useEffect(
    () =>
      registerCommands([
        {
          id: "themes.edit",
          title: "Edit current theme",
          keys: "Ctrl+K E",
          run: async () => {
            setSession(startSession());
            setRecentColors(await loadRecentColors());
          },
        },
      ]),
    [],
  );

  const cancel = () => {
    if (session) {
      preview(session.original);
    }
    setSession(null);
  };
  useDismiss(session !== null, cancel);

  if (!session) {
    return null;
  }

  const { look, original, file, taken } = session;
  const draft = look.theme;
  const problem = nameProblem(draft.name, taken);

  const setLook = (next: Look) => {
    setSession({ ...session, look: next });
    preview(next);
  };
  const update = (changes: Partial<Theme>) => setLook({ ...look, theme: { ...draft, ...changes } });
  const undo = () => setLook({ ...original, theme: { ...original.theme, name: draft.name } });
  const restoreDefaults = () =>
    setLook({ ...look, theme: applyStartingPoint(draft, DEFAULT_THEME) });
  const save = async () => {
    if (problem) {
      return;
    }
    setSession(null);
    await saveEditedTheme({ ...draft, name: draft.name.trim() }, file);
    await addRecentColors(changedColors(original.theme, draft)).catch(() => undefined);
    if (look.custom !== original.custom) {
      await useThemeStore.getState().setCustom(look.custom);
    }
    const { theme, effects, commit } = useThemeStore.getState();
    if (effects.surface !== draft.effects.surface) {
      await commit(theme, { ...effects, surface: draft.effects.surface });
    }
  };

  return (
    <aside className="theme-editor panel" aria-label="Theme editor">
      <header className="theme-editor__header">
        <h2>{file ? "Edit theme" : `New theme from ${original.theme.name}`}</h2>
      </header>
      <div className="theme-editor__body">
        <label className="theme-editor__name">
          <span>Name</span>
          <input
            value={draft.name}
            aria-invalid={problem !== null}
            onChange={(event) => update({ name: event.target.value })}
            // biome-ignore lint/a11y/noAutofocus: the editor opens from a command and takes focus
            autoFocus
          />
        </label>
        {problem && (
          <p className="theme-editor__problem" role="alert">
            {problem}
          </p>
        )}
        <StartingPoints
          onPick={(start) => setLook({ ...look, theme: applyStartingPoint(draft, start) })}
        />
        <h3>Interface</h3>
        {UI_FIELDS.map(([key, label]) => (
          <ColorField
            key={key}
            label={label}
            value={draft.ui[key]}
            background={key === "text" ? draft.ui.bg : undefined}
            suggestions={SUGGESTIONS_ID}
            onChange={(value) => update({ ui: { ...draft.ui, [key]: value } })}
          />
        ))}
        <h3>Syntax</h3>
        {SYNTAX_FIELDS.map(([key, label]) => (
          <ColorField
            key={key}
            label={label}
            value={draft.syntax[key]}
            background={draft.ui.bg}
            suggestions={SUGGESTIONS_ID}
            onChange={(value) => update({ syntax: { ...draft.syntax, [key]: value } })}
          />
        ))}
        <ShapeFields shape={draft.shape} onChange={(shape) => update({ shape })} />
        <LookFields look={look} onChange={setLook} />
      </div>
      <datalist id={SUGGESTIONS_ID}>
        {[
          ...new Set([
            ...recentColors,
            ...Object.values(draft.ui).map((color) => color.slice(0, 7).toLowerCase()),
          ]),
        ].map((color) => (
          <option key={color} value={color} />
        ))}
      </datalist>
      <footer className="theme-editor__footer">
        <button type="button" className="theme-editor__secondary" onClick={undo}>
          Undo changes
        </button>
        <button
          type="button"
          className="theme-editor__secondary theme-editor__defaults"
          onClick={restoreDefaults}
        >
          Defaults
        </button>
        <button type="button" onClick={cancel}>
          Cancel
        </button>
        <button type="button" className="theme-editor__save" onClick={save} disabled={!!problem}>
          {file ? "Save" : "Save as new theme"}
        </button>
      </footer>
    </aside>
  );
}
