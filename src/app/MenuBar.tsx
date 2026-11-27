import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { runCommand } from "../lib/commands";
import { useDismiss } from "../lib/dismiss";
import { useLayoutStore } from "../lib/layoutStore";
import { MenuPopup } from "./MenuPopup";
import { useMenus } from "./useMenus";

const TOP_EDGE = 3;
const LEAVE_DISTANCE = 80;

export function MenuBar() {
  const mode = useLayoutStore((state) => state.menuBar);
  const menus = useMenus();
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [fromKeyboard, setFromKeyboard] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const visible = mode === "always" || (mode === "auto" && (revealed || open !== null));

  const hide = () => {
    setOpen(null);
    setRevealed(false);
  };
  useDismiss(open !== null, () => setOpen(null), barRef);

  useEffect(() => {
    if (mode === "never") {
      return;
    }
    let altAlone = false;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      altAlone = event.key === "Alt" && !event.ctrlKey && !event.shiftKey && !event.metaKey;
    };
    const onKeyUp = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Alt" || !altAlone) {
        return;
      }
      altAlone = false;
      setFromKeyboard(true);
      setRevealed((shown) => !shown);
      setOpen(null);
    };
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "auto") {
      return;
    }
    const onPointerMove = (event: PointerEvent) => {
      if (event.clientY <= TOP_EDGE) {
        setFromKeyboard(false);
        setRevealed(true);
      } else if (
        event.clientY > LEAVE_DISTANCE &&
        !barRef.current?.contains(document.activeElement)
      ) {
        setRevealed((shown) => (shown && !fromKeyboard ? false : shown));
      }
    };
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [mode, fromKeyboard]);

  useEffect(() => {
    if (open !== null) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (fromKeyboard && !barRef.current?.contains(event.target as Node)) {
        setRevealed(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, fromKeyboard]);

  useEffect(() => {
    if (open === null) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!barRef.current?.contains(event.target as Node)) {
        setOpen(null);
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  useEffect(() => {
    if (visible && fromKeyboard && open === null) {
      barRef.current?.querySelector<HTMLElement>(".menu-bar__title")?.focus();
    }
  }, [visible, fromKeyboard, open]);

  if (!visible) {
    return null;
  }

  const run = (id: string) => {
    hide();
    runCommand(id);
  };

  const onTitleKey = (event: KeyboardEvent, index: number) => {
    const titles = [...(barRef.current?.querySelectorAll<HTMLElement>(".menu-bar__title") ?? [])];
    const go = (next: number) => {
      const target = (next + menus.length) % menus.length;
      titles[target]?.focus();
      if (open !== null) {
        setOpen(target);
      }
    };
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(index);
    } else if (event.key === "Escape" && open === null) {
      event.preventDefault();
      event.stopPropagation();
      hide();
    }
  };

  return (
    <div
      ref={barRef}
      className="menu-bar panel"
      role="menubar"
      aria-label="Menu bar"
      data-mode={mode}
      onPointerLeave={() => {
        if (mode === "auto" && open === null && !fromKeyboard) {
          setRevealed(false);
        }
      }}
    >
      {menus.map((menu, index) => (
        <div key={menu.label} className="menu-bar__menu">
          <button
            type="button"
            role="menuitem"
            className="menu-bar__title"
            aria-haspopup="menu"
            aria-expanded={open === index}
            onClick={() => setOpen(open === index ? null : index)}
            onPointerEnter={() => open !== null && setOpen(index)}
            onKeyDown={(event) => onTitleKey(event, index)}
          >
            {menu.label}
          </button>
          {open === index && (
            <MenuPopup
              label={menu.label}
              items={menu.items}
              onRun={run}
              onClose={() => setOpen(null)}
              className="menu-bar__popup"
              focusFirst={fromKeyboard}
            />
          )}
        </div>
      ))}
    </div>
  );
}
