import { deleteUserTheme, exportTheme, importTheme, saveUserTheme } from "../../lib/ipc";
import { DEFAULT_THEME } from "./builtinThemes";
import { readTheme } from "./parseTheme";
import type { Theme } from "./theme";
import { nameKey, type UserTheme, uniqueName } from "./userThemes";
import { allThemes, findTheme, reloadUserThemes, useThemeStore } from "./useThemeStore";

function report(message: string): void {
  useThemeStore.setState({ warnings: [message] });
}

async function attempt(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    report(String(error));
  }
}

async function choose(theme: Theme): Promise<void> {
  const { effects, commit } = useThemeStore.getState();
  await commit(theme, effects);
}

async function addUserTheme(theme: Theme): Promise<string> {
  const taken = allThemes(useThemeStore.getState().userThemes).map(({ name }) => name);
  const named = { ...theme, name: uniqueName(theme.name, taken) };
  await saveUserTheme(null, named);
  await reloadUserThemes();
  await choose(findTheme(named.name) ?? named);
  return named.name;
}

export function saveEditedTheme(theme: Theme, file: string | null): Promise<void> {
  return attempt(async () => {
    if (!file) {
      await addUserTheme(theme);
      return;
    }
    await saveUserTheme(file, theme);
    await reloadUserThemes();
    await choose(findTheme(theme.name) ?? theme);
  });
}

export function currentUserTheme(): UserTheme | null {
  const { theme, userThemes } = useThemeStore.getState();
  return (
    userThemes.find((userTheme) => nameKey(userTheme.theme.name) === nameKey(theme.name)) ?? null
  );
}

export function duplicateCurrentTheme(): Promise<void> {
  return attempt(async () => {
    const { theme } = useThemeStore.getState();
    await addUserTheme({ ...theme, name: `${theme.name} copy` });
  });
}

export function importThemeFile(): Promise<void> {
  return attempt(async () => {
    const source = await importTheme();
    if (source === null) {
      return;
    }
    const { theme, warnings } = readTheme(source);
    if (!theme) {
      report(`could not import the theme: ${warnings.join("; ")}`);
      return;
    }
    const name = await addUserTheme(theme);
    if (name !== theme.name) {
      report(`"${theme.name}" already exists; imported as "${name}"`);
    }
  });
}

export function exportCurrentTheme(): Promise<void> {
  return attempt(async () => {
    await exportTheme(useThemeStore.getState().theme);
  });
}

export function deleteCurrentTheme(): Promise<void> {
  return attempt(async () => {
    const userTheme = currentUserTheme();
    if (!userTheme) {
      report("built-in themes cannot be deleted");
      return;
    }
    const question = `Delete the theme "${userTheme.theme.name}"? Its file is removed from the themes folder.`;
    if (!window.confirm(question)) {
      return;
    }
    await deleteUserTheme(userTheme.file);
    await reloadUserThemes();
    await choose(DEFAULT_THEME);
  });
}
