export type TerminalRequest = { label: string; command: string };

type Listener = (request: TerminalRequest) => void;

const listeners = new Set<Listener>();

export function requestTerminal(request: TerminalRequest): void {
  for (const listener of listeners) {
    listener(request);
  }
}

export function onTerminalRequest(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
