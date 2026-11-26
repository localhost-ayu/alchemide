import { expect, test } from "vitest";
import {
  onTerminalExit,
  onTerminalOutput,
  terminalClose,
  terminalOpen,
  terminalProfiles,
  terminalWrite,
} from "./ipc.mock";

test("the mock shell echoes input and answers each command", async () => {
  const received: string[] = [];
  await onTerminalOutput(({ data }) => received.push(data));
  const id = await terminalOpen(null, 80, 24);
  await new Promise((resolve) => setTimeout(resolve, 0));

  await terminalWrite(id, "ls");
  await terminalWrite(id, "\r");

  const output = received.join("");
  expect(output).toContain(`Mock shell #${id}`);
  expect(output).toContain("ran: ls");
});

test("closing a mock terminal reports its exit and refuses more input", async () => {
  const exited: number[] = [];
  await onTerminalExit((id) => exited.push(id));
  const id = await terminalOpen(null, 80, 24);

  await terminalClose(id);

  expect(exited).toContain(id);
  await expect(terminalWrite(id, "x")).rejects.toThrow("no longer open");
});

test("the mock offers profiles and rejects unknown ones", async () => {
  const profiles = await terminalProfiles();
  expect(profiles.map((profile) => profile.label)).toEqual(["bash", "WSL · Ubuntu"]);
  await expect(terminalOpen("wsl:Ubuntu", 80, 24)).resolves.toBeTypeOf("number");
  await expect(terminalOpen("cmd", 80, 24)).rejects.toThrow("not available");
});
