import { useEffect } from "react";
import { useAssetUrl } from "./useAssetUrl";
import { useThemeStore } from "./useThemeStore";

export function Mascot() {
  const mascot = useThemeStore((state) => state.custom.mascot ?? state.theme.mascot);
  const url = useAssetUrl(mascot?.path ?? null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        const { theme, effects, commit } = useThemeStore.getState();
        commit(theme, { ...effects, mascot: !effects.mascot });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
