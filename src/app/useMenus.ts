import { useMemo } from "react";
import { useCommandStore } from "../lib/commands";
import { buildMenus, type Menu } from "./menus";

export function useMenus(): Menu[] {
  const commands = useCommandStore((state) => state.commands);
  const overrides = useCommandStore((state) => state.overrides);
  return useMemo(() => buildMenus(Object.values(commands), overrides), [commands, overrides]);
}
