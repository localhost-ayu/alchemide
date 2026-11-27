import { expect, test } from "vitest";
import { tabDetails } from "./tabLabels";

test("unique names get no detail", () => {
  expect(tabDetails(["/p/a.ts", "/p/src/b.ts"]).size).toBe(0);
});

test("same names show their nearest different folder", () => {
  const details = tabDetails(["/portal/conexao.php", "/portal/beer/conexao.php", "/portal/x.php"]);
  expect(details.get("/portal/conexao.php")).toBe("portal");
  expect(details.get("/portal/beer/conexao.php")).toBe("beer");
  expect(details.has("/portal/x.php")).toBe(false);
});

test("goes deeper while the nearest folders are equal", () => {
  const details = tabDetails(["/p/a/src/index.ts", "/p/b/src/index.ts"]);
  expect(details.get("/p/a/src/index.ts")).toBe("a/src");
  expect(details.get("/p/b/src/index.ts")).toBe("b/src");
});

test("understands Windows paths", () => {
  const details = tabDetails(["C:\\p\\beer\\conexao.php", "C:\\p\\conexao.php"]);
  expect(details.get("C:\\p\\beer\\conexao.php")).toBe("beer");
  expect(details.get("C:\\p\\conexao.php")).toBe("p");
});
