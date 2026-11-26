import { describe, expect, test } from "vitest";
import {
  backgroundFromPath,
  mascotFromPath,
  NO_CUSTOM_LOOK,
  readCustomLook,
  withCustomLook,
} from "./customLook";
import { FALLBACK_THEME } from "./fallbackTheme";

test("detects videos by extension", () => {
  expect(backgroundFromPath("backgrounds/rain.webm").type).toBe("video");
  expect(backgroundFromPath("backgrounds/rain.MP4").type).toBe("video");
  expect(backgroundFromPath("backgrounds/lab.gif").type).toBe("image");
});

describe("readCustomLook", () => {
  test("reads a saved background and mascot", () => {
    const look = readCustomLook(
      {
        background: backgroundFromPath("backgrounds/lab.png"),
        mascot: mascotFromPath("mascots/m.png"),
      },
      FALLBACK_THEME,
    );
    expect(look.background).toMatchObject({ type: "image", path: "backgrounds/lab.png" });
    expect(look.mascot).toMatchObject({ path: "mascots/m.png", corner: "bottom-right" });
  });

  test("ignores missing, unsafe or non-media values", () => {
    expect(readCustomLook({}, FALLBACK_THEME)).toEqual(NO_CUSTOM_LOOK);
    expect(
      readCustomLook(
        { background: { type: "image", path: "../x.png" }, mascot: { path: "/etc/x.png" } },
        FALLBACK_THEME,
      ),
    ).toEqual(NO_CUSTOM_LOOK);
    expect(
      readCustomLook({ background: { type: "solid", color: "#000000" } }, FALLBACK_THEME),
    ).toEqual(NO_CUSTOM_LOOK);
  });
});

test("custom background and mascot override the theme's own", () => {
  const custom = { background: backgroundFromPath("backgrounds/a.png"), mascot: null };
  const theme = withCustomLook(FALLBACK_THEME, custom);
  expect(theme.background).toEqual(custom.background);
  expect(theme.mascot).toBeNull();
  expect(theme.ui).toBe(FALLBACK_THEME.ui);
  expect(withCustomLook(FALLBACK_THEME, NO_CUSTOM_LOOK).background).toBe(FALLBACK_THEME.background);
});
