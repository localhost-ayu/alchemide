import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";
import { playfulTouchesEnabled } from "../../lib/activityStore";
import { keyBelongsToApp } from "../../lib/commands";
import { onTerminalOutput, terminalResize, terminalWrite } from "../../lib/ipc";
import { readRootVariable, terminalTheme } from "./terminalTheme";
import "@xterm/xterm/css/xterm.css";

type TerminalViewProps = {
  id: number;
  isActive: boolean;
};

export function TerminalView({ id, isActive }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const terminalRef = useRef<Terminal | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: getComputedStyle(document.documentElement).getPropertyValue("--font-code"),
      fontSize: 13,
      allowTransparency: true,
      theme: terminalTheme(readRootVariable, playfulTouchesEnabled()),
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(container);
    terminal.attachCustomKeyEventHandler(
      (event) => event.type !== "keydown" || !keyBelongsToApp(event),
    );
    terminalRef.current = terminal;
    fitRef.current = fit;

    const input = terminal.onData((data) => {
      terminalWrite(id, data).catch(() => {});
    });
    const resize = terminal.onResize(({ cols, rows }) => {
      terminalResize(id, cols, rows).catch(() => {});
    });
    const output = onTerminalOutput((event) => {
      if (event.id === id) {
        terminal.write(event.data);
      }
    });
    const observer = new ResizeObserver(() => {
      if (container.offsetParent !== null) {
        fit.fit();
      }
    });
    observer.observe(container);
    const themeObserver = new MutationObserver(() => {
      terminal.options.theme = terminalTheme(readRootVariable, playfulTouchesEnabled());
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "data-animations"],
    });

    return () => {
      observer.disconnect();
      themeObserver.disconnect();
      input.dispose();
      resize.dispose();
      output.then((unsubscribe) => unsubscribe());
      terminal.dispose();
      terminalRef.current = null;
      fitRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    if (isActive) {
      fitRef.current?.fit();
      terminalRef.current?.focus();
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className="terminal-view"
      hidden={!isActive}
      data-testid={`terminal-${id}`}
    />
  );
}
