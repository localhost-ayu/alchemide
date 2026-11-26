import { importAsset } from "../../lib/ipc";
import { backgroundFromPath, mascotFromPath } from "./customLook";
import type { LookAction } from "./moodOptions";
import { useThemeStore } from "./useThemeStore";

async function turnOn(effect: "background" | "mascot"): Promise<void> {
  const { theme, effects, commit } = useThemeStore.getState();
  if (!effects[effect]) {
    await commit(theme, { ...effects, [effect]: true });
  }
}

async function pick(kind: "background" | "mascot"): Promise<void> {
  const path = await importAsset(kind);
  if (!path) {
    return;
  }
  const { setCustom } = useThemeStore.getState();
  if (kind === "background") {
    await setCustom({ background: backgroundFromPath(path) });
  } else {
    await setCustom({ mascot: mascotFromPath(path) });
  }
  await turnOn(kind);
}

export async function runLookAction(action: LookAction): Promise<void> {
  const { setCustom } = useThemeStore.getState();
  try {
    switch (action) {
      case "pick-background":
        return await pick("background");
      case "pick-mascot":
        return await pick("mascot");
      case "clear-background":
        return await setCustom({ background: null });
      case "clear-mascot":
        return await setCustom({ mascot: null });
    }
  } catch (error) {
    useThemeStore.setState({ warnings: [String(error)] });
  }
}
