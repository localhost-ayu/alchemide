import { useEffect, useRef } from "react";
import { isRecording } from "./commands";

type Entry = { close: () => void };

const stack: Entry[] = [];
let listening = false;

function listen(): void {
  if (listening || typeof window === "undefined") {
    return;
  }
  listening = true;
  window.addEventListener(
    "keydown",
    (event) => {
      const top = stack[stack.length - 1];
      if (event.key !== "Escape" || !top || isRecording()) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      top.close();
    },
    true,
  );
}

export function useDismiss(isOpen: boolean, close: () => void): void {
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    listen();
    const entry: Entry = { close: () => closeRef.current() };
    stack.push(entry);
    return () => {
      const index = stack.indexOf(entry);
      if (index !== -1) {
        stack.splice(index, 1);
      }
    };
  }, [isOpen]);
}
