import { useEffect, useMemo, useState } from "react";
import { registerCommands, useCommandStore } from "../../lib/commands";
import { useT } from "../../lib/i18n";
import { rankByFuzzy } from "./fuzzyMatch";
import { Palette } from "./Palette";
import "./palette.css";

const OWN_ID = "palette.commands";

export function CommandPalette() {
  const t = useT();
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const commands = useCommandStore((state) => state.commands);

  useEffect(
    () =>
      registerCommands([
        {
          id: OWN_ID,
          title: t("palette.showCommands"),
          keys: "Ctrl+Shift+P",
          run: () => {
            setQuery("");
            setOpen(true);
          },
        },
      ]),
    [t],
  );

  const items = useMemo(() => {
    const available = Object.values(commands)
      .filter((command) => command.id !== OWN_ID)
      .sort((a, b) => a.title.localeCompare(b.title));
    return rankByFuzzy(query, available, (command) => command.title).map((command) => ({
      id: command.id,
      label: command.title,
      hint: command.keys,
    }));
  }, [commands, query]);

  if (!isOpen) {
    return null;
  }
  return (
    <Palette
      label={t("palette.runCommand")}
      placeholder={t("palette.typeCommand")}
      query={query}
      items={items}
      emptyText={t("palette.noCommand")}
      onQueryChange={setQuery}
      onClose={() => setOpen(false)}
      onChoose={(item) => {
        setOpen(false);
        useCommandStore.getState().commands[item.id]?.run();
      }}
    />
  );
}
