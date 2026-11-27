import { describe, expect, test } from "vitest";
import {
  backgroundFromPath,
  changeBackground,
  changeMascot,
  mascotFromPath,
  NO_CUSTOM_LOOK,
  readCustomLook,
  shownBackground,
  shownMascot,
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

describe("adjusting the background and mascot on screen", () => {
  const imageTheme = {
    ...FALLBACK_THEME,
    background: backgroundFromPath("backgrounds/theme.png"),
    mascot: mascotFromPath("mascots/theme.png"),
  };

  test("changes the theme's own background and mascot when there is no custom look", () => {
    const look = { theme: imageTheme, custom: NO_CUSTOM_LOOK };

    const changed = changeMascot(changeBackground(look, { dim: 0.2, fit: "contain" }), {
      size: 120,
      corner: "top-left",
    });

    expect(shownBackground(changed)).toMatchObject({ path: "backgrounds/theme.png", dim: 0.2 });
    expect(changed.theme.background).toMatchObject({ fit: "contain" });
    expect(changed.theme.mascot).toMatchObject({ size: 120, corner: "top-left" });
    expect(changed.custom).toBe(NO_CUSTOM_LOOK);
  });

  test("changes your own background and mascot, which win over the theme's", () => {
    const custom = {
      background: backgroundFromPath("backgrounds/mine.png"),
      mascot: mascotFromPath("mascots/mine.png"),
    };
    const look = { theme: imageTheme, custom };

    const changed = changeMascot(changeBackground(look, { blur: 8 }), { opacity: 0.9 });

    expect(shownBackground(changed)).toMatchObject({ path: "backgrounds/mine.png", blur: 8 });
    expect(shownMascot(changed)).toMatchObject({ path: "mascots/mine.png", opacity: 0.9 });
    expect(changed.theme).toBe(imageTheme);
  });

  test("leaves solid and gradient backgrounds and a missing mascot alone", () => {
    const look = { theme: FALLBACK_THEME, custom: NO_CUSTOM_LOOK };

    expect(shownBackground(look)).toBeNull();
    expect(shownMascot(look)).toBeNull();
    expect(changeMascot(changeBackground(look, { dim: 0 }), { size: 64 })).toBe(look);
  });
});
