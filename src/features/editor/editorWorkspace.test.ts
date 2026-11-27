import { expect, test } from "vitest";
import { isWindowsPath, matchDriveCase } from "./editorWorkspace";

test("tells Windows roots from POSIX roots", () => {
  expect(isWindowsPath("C:\\Users\\me\\lab")).toBe(true);
  expect(isWindowsPath("\\\\wsl.localhost\\Ubuntu\\home\\me")).toBe(true);
  expect(isWindowsPath("/home/me/lab")).toBe(false);
});

test("uses the drive letter case of the open folder", () => {
  expect(matchDriveCase("c:\\Users\\me\\lab\\app.ts", "C:\\Users\\me\\lab")).toBe(
    "C:\\Users\\me\\lab\\app.ts",
  );
  expect(matchDriveCase("d:\\other\\app.ts", "C:\\Users\\me\\lab")).toBe("d:\\other\\app.ts");
  expect(matchDriveCase("/home/me/lab/app.ts", "/home/me/lab")).toBe("/home/me/lab/app.ts");
});
