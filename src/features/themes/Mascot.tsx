import { useEffect } from "react";
import { registerCommands } from "../../lib/commands";
import { useAssetUrl } from "./useAssetUrl";
import { useThemeStore } from "./useThemeStore";

export function Mascot() {
  const mascot = useThemeStore((state) => state.custom.mascot ?? state.theme.mascot);
  const url = useAssetUrl(mascot?.path ?? null);

  useEffect(
    () =>
      registerCommands([
        {
          id: "themes.toggleMascot",
          title: "Show or hide the mascot",
          keys: "Ctrl+Alt+M",
          run: () => {
            const { theme, effects, commit } = useThemeStore.getState();
            commit(theme, { ...effects, mascot: !effects.mascot });
          },
        },
      ]),
    [],
  );

  if (!mascot || !url) {
    return null;
  }
  return (
    <img
      className="mascot"
      data-corner={mascot.corner}
      src={url}
      alt=""
      aria-hidden="true"
      style={{ width: `${mascot.size}px`, opacity: mascot.opacity }}
    />
  );
}
