import { expect, test } from "vitest";
import {
  onTerminalExit,
  onTerminalOutput,
  terminalClose,
  terminalOpen,
  terminalWrite,
} from "./ipc.mock";

test("the mock shell echoes input and answers each command", async () => {
  const received: string[] = [];
  await onTerminalOutput(({ data }) => received.push(data));
  const id = await terminalOpen(80, 24);
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
  const id = await terminalOpen(80, 24);

  await terminalClose(id);

  expect(exited).toContain(id);
  await expect(terminalWrite(id, "x")).rejects.toThrow("no longer open");
});
