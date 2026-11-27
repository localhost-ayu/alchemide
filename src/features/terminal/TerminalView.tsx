import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";
import { playfulTouchesEnabled } from "../../lib/activityStore";
import { keyBelongsToApp } from "../../lib/commands";
import { fontStack, useEditorSettings } from "../../lib/editorSettings";
import { loadBundledFont } from "../../lib/fonts";
import { onTerminalOutput, terminalResize, terminalWrite } from "../../lib/ipc";
import { readRootVariable, resolveTerminalTheme } from "./terminalTheme";
import { useTerminalSettings } from "./useTerminalSettings";
import "@xterm/xterm/css/xterm.css";

type TerminalViewProps = {
  id: number;
  isActive: boolean;
};

function paint(terminal: Terminal, container: HTMLElement, palette: string): void {
  const theme = resolveTerminalTheme(palette, readRootVariable, playfulTouchesEnabled());
  terminal.options.theme = theme;
  container.style.backgroundColor = theme.background ?? "";
}

export function TerminalView({ id, isActive }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const terminalRef = useRef<Terminal | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const settings = useTerminalSettings.getState();
    const terminal = new Terminal({
      cursorBlink: settings.cursorBlink,
      cursorStyle: settings.cursorStyle,
      scrollback: settings.scrollback,
      lineHeight: settings.lineHeight,
      fontFamily: fontStack(settings.fontFamily || useEditorSettings.getState().fontFamily),
      fontSize: useEditorSettings.getState().terminalFontSize,
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(container);
    paint(terminal, container, settings.palette);
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
    const bell = terminal.onBell(() => {
      if (!useTerminalSettings.getState().visualBell) {
        return;
      }
      container.dataset.bell = "true";
      setTimeout(() => delete container.dataset.bell, 150);
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
      paint(terminal, container, useTerminalSettings.getState().palette);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "data-animations"],
    });

    return () => {
      observer.disconnect();
      themeObserver.disconnect();
      input.dispose();
      bell.dispose();
      resize.dispose();
      output.then((unsubscribe) => unsubscribe());
      terminal.dispose();
      terminalRef.current = null;
      fitRef.current = null;
    };
  }, [id]);

  const editorFont = useEditorSettings((state) => state.fontFamily);
  const ownFont = useTerminalSettings((state) => state.fontFamily);
  const fontFamily = ownFont || editorFont;
  const fontSize = useEditorSettings((state) => state.terminalFontSize);
  useEffect(() => {
    let current = true;
    loadBundledFont(fontFamily).then(() => {
      const terminal = terminalRef.current;
      if (!current || !terminal) {
        return;
      }
      terminal.options.fontFamily = fontStack(fontFamily);
      terminal.options.fontSize = fontSize;
      if (containerRef.current?.offsetParent) {
        fitRef.current?.fit();
      }
    });
    return () => {
      current = false;
    };
  }, [fontFamily, fontSize]);

  const palette = useTerminalSettings((state) => state.palette);
  const cursorStyle = useTerminalSettings((state) => state.cursorStyle);
  const cursorBlink = useTerminalSettings((state) => state.cursorBlink);
  const scrollback = useTerminalSettings((state) => state.scrollback);
  const lineHeight = useTerminalSettings((state) => state.lineHeight);
  const padding = useTerminalSettings((state) => state.padding);
  useEffect(() => {
    const terminal = terminalRef.current;
    const container = containerRef.current;
    if (!terminal || !container) {
      return;
    }
    paint(terminal, container, palette);
    terminal.options.cursorStyle = cursorStyle;
    terminal.options.cursorBlink = cursorBlink;
    terminal.options.scrollback = scrollback;
    terminal.options.lineHeight = lineHeight;
    if (containerRef.current?.offsetParent) {
      fitRef.current?.fit();
    }
  }, [palette, cursorStyle, cursorBlink, scrollback, lineHeight]);

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
      style={{ padding: `${padding}px` }}
      hidden={!isActive}
      data-testid={`terminal-${id}`}
    />
  );
}
