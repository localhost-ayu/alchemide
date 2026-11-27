import { expect, test } from "vitest";
import type { DockerContainer } from "../../lib/types";
import { dockerNotice, logsCommand, splitByState } from "./containers";

function container(name: string, state: string, project: string | null): DockerContainer {
  return {
    id: `${name.length}`.repeat(64).slice(0, 64),
    name,
    image: "img",
    state,
    status: state,
    ports: "",
    project,
  };
}

test("splits running from stopped containers, grouped by project then name", () => {
  const { active, inactive } = splitByState([
    container("zeta", "running", null),
    container("web", "running", "shop"),
    container("db", "paused", "shop"),
    container("old", "exited", "blog"),
    container("tmp", "created", null),
  ]);

  expect(active.map(({ name }) => name)).toEqual(["db", "web", "zeta"]);
  expect(inactive.map(({ name }) => name)).toEqual(["old", "tmp"]);
});

test("follows the logs by short id", () => {
  const db = { ...container("db", "running", null), id: "49cf015398a5f35c7c63d63a8b7de3f1" };
  expect(logsCommand(db)).toBe("docker logs --follow --tail 200 49cf015398a5");
});

test("explains a missing or stopped Docker in plain words", () => {
  expect(dockerNotice("Docker is not installed or not on the PATH")).toMatch(/not installed/);
  expect(
    dockerNotice("Docker: error during connect: this error may indicate the daemon is not running"),
  ).toMatch(/Docker is not running/);
  expect(dockerNotice("Error: Docker: No such container")).toBe("Docker: No such container");
});

test("recognizes the missing Docker message in Portuguese too", () => {
  expect(dockerNotice("o Docker não está instalado ou não está no PATH")).toBe(
    "Docker is not installed or not on the PATH.",
  );
});
