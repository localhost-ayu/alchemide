import { expect, test } from "vitest";
import { isRemoteImage, linkKind } from "./linkKind";

test("classifies links", () => {
  expect(linkKind("https://example.com")).toBe("external");
  expect(linkKind("mailto:a@b.c")).toBe("external");
  expect(linkKind("#install")).toBe("anchor");
  expect(linkKind("docs/themes.md")).toBe("other");
  expect(linkKind(undefined)).toBe("other");
});

test("recognizes remote images", () => {
  expect(isRemoteImage("https://example.com/a.png")).toBe(true);
  expect(isRemoteImage("docs/screenshot.png")).toBe(false);
  expect(isRemoteImage("data:image/png;base64,AAAA")).toBe(false);
});
