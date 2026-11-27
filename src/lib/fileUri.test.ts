import { expect, test } from "vitest";
import { fileUri, pathFromUri } from "./fileUri";

test("turns POSIX paths into file URIs", () => {
  expect(fileUri("/home/me/lab/app.ts")).toBe("file:///home/me/lab/app.ts");
  expect(fileUri("/home/me/my lab/ação.ts")).toBe("file:///home/me/my%20lab/a%C3%A7%C3%A3o.ts");
});

test("turns Windows drive paths into file URIs", () => {
  expect(fileUri("C:\\Users\\me\\lab\\app.ts")).toBe("file:///C:/Users/me/lab/app.ts");
  expect(fileUri("d:\\My Lab\\#1.php")).toBe("file:///d:/My%20Lab/%231.php");
});

test("keeps the host of UNC paths, such as WSL folders", () => {
  expect(fileUri("\\\\wsl.localhost\\Ubuntu\\home\\me\\app.ts")).toBe(
    "file://wsl.localhost/Ubuntu/home/me/app.ts",
  );
});

test("turns file URIs back into the paths they came from", () => {
  const paths: [string, boolean][] = [
    ["/home/me/my lab/ação.ts", false],
    ["C:\\Users\\me\\lab\\app.ts", true],
    ["\\\\wsl.localhost\\Ubuntu\\home\\me\\app.ts", true],
  ];
  for (const [path, windows] of paths) {
    expect(pathFromUri(fileUri(path), windows)).toBe(path);
  }
  expect(pathFromUri("file:///c%3A/Users/me/app.ts", true)).toBe("c:\\Users\\me\\app.ts");
  expect(pathFromUri("https://example.com", false)).toBeNull();
});
