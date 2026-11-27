import { type RefObject, useEffect, useRef } from "react";
import { isRecording } from "./commands";

type Entry = { close: () => void; element: () => HTMLElement | null };

const stack: Entry[] = [];
let listening = false;
let closeOnOutsideClick = false;

export function setCloseOnOutsideClick(enabled: boolean): void {
  closeOnOutsideClick = enabled;
}

export function isOutside(element: HTMLElement | null, target: EventTarget | null): boolean {
  return element !== null && target instanceof Node && !element.contains(target);
}

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
  window.addEventListener(
    "pointerdown",
    (event) => {
      const top = stack[stack.length - 1];
      if (!closeOnOutsideClick || !top || isRecording()) {
        return;
      }
      if (isOutside(top.element(), event.target)) {
        top.close();
      }
    },
    true,
  );
}

export function useDismiss<T extends HTMLElement = HTMLDivElement>(
  isOpen: boolean,
  close: () => void,
  ref?: RefObject<T | null>,
): RefObject<T | null> {
  const ownRef = useRef<T | null>(null);
  const panelRef = ref ?? ownRef;
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    listen();
    const entry: Entry = { close: () => closeRef.current(), element: () => panelRef.current };
    stack.push(entry);
    return () => {
      const index = stack.indexOf(entry);
      if (index !== -1) {
        stack.splice(index, 1);
      }
    };
  }, [isOpen, panelRef]);

  return panelRef;
}
