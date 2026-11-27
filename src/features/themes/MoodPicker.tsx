import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { registerCommands } from "../../lib/commands";
import { useDismiss } from "../../lib/dismiss";
import { useKeepInView } from "../../lib/useKeepInView";
import { filterOptions, type MoodOption, moodOptions } from "./moodOptions";
import { runLookAction } from "./runLookAction";
import type { Effects, Theme } from "./theme";
import { useThemeStore } from "./useThemeStore";

type Choice = { theme: Theme; effects: Effects };

function choiceFor(option: MoodOption, base: Choice): Choice {
  switch (option.kind) {
    case "theme":
      return { theme: option.theme, effects: base.effects };
    case "preset":
      return { theme: base.theme, effects: option.preset.effects };
    case "action":
      return base;
  }
}

export function MoodPicker() {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const originalRef = useRef<Choice | null>(null);
  const custom = useThemeStore((state) => state.custom);
  const userThemes = useThemeStore((state) => state.userThemes);
  const options = useMemo(
    () =>
      filterOptions(
        moodOptions(
          undefined,
          custom,
          userThemes.map((userTheme) => userTheme.theme),
        ),
        query,
      ),
    [custom, userThemes, query],
  );
  const highlighted = options[Math.min(index, options.length - 1)];
  useKeepInView(isOpen ? highlighted?.id : undefined);

  useEffect(
    () =>
      registerCommands([
        {
          id: "themes.pickMood",
          title: "Choose theme or effects",
          keys: "Ctrl+K M",
          run: () => {
            const { theme, effects } = useThemeStore.getState();
            originalRef.current = { theme, effects };
            setQuery("");
            setIndex(0);
            setOpen(true);
          },
        },
      ]),
    [],
  );

  useEffect(() => {
    const original = originalRef.current;
    if (!isOpen || !original || !highlighted) {
      return;
    }
    const { theme, effects } = choiceFor(highlighted, original);
    useThemeStore.getState().preview(theme, effects);
  }, [isOpen, highlighted]);

  const close = () => {
    const original = originalRef.current;
    if (original) {
      useThemeStore.getState().preview(original.theme, original.effects);
    }
    setOpen(false);
  };
  const panelRef = useDismiss(isOpen, close);

  if (!isOpen) {
    return null;
  }

  const choose = (option: MoodOption | undefined) => {
    const original = originalRef.current;
    if (!option || !original) {
      return;
    }
    setOpen(false);
    if (option.kind === "action") {
      useThemeStore.getState().preview(original.theme, original.effects);
      runLookAction(option.action);
      return;
    }
    const { theme, effects } = choiceFor(option, original);
    useThemeStore.getState().commit(theme, effects);
  };

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex((current) => (current + 1) % Math.max(options.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex((current) => (current - 1 + options.length) % Math.max(options.length, 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(highlighted);
    }
  };

  return (
    <div className="mood-picker__overlay">
      <div ref={panelRef} className="mood-picker panel" role="dialog" aria-label="Choose a mood">
        <input
          className="mood-picker__search"
          role="combobox"
          aria-expanded="true"
          aria-controls="mood-options"
          aria-activedescendant={highlighted?.id}
          aria-label="Search themes and effects"
          placeholder="Theme or effects preset"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIndex(0);
          }}
          onKeyDown={handleKeyDown}
          onBlur={close}
          // biome-ignore lint/a11y/noAutofocus: the picker opens from a shortcut and must take focus
          autoFocus
        />
        <div id="mood-options" className="mood-picker__list" role="listbox">
          {options.map((option, position) => (
            <div
              key={option.id}
              id={option.id}
              role="option"
              tabIndex={-1}
              aria-selected={option === highlighted}
              className="mood-picker__option"
              onMouseEnter={() => setIndex(position)}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(option);
              }}
            >
              <span>{option.label}</span>
              <span className="mood-picker__group">{option.group}</span>
            </div>
          ))}
          {options.length === 0 && <p className="mood-picker__empty">No match</p>}
        </div>
      </div>
    </div>
  );
}
