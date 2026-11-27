import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { runCommand } from "../lib/commands";
import { useDismiss } from "../lib/dismiss";
import { MenuPopup } from "./MenuPopup";
import { useMenus } from "./useMenus";

type SettingsMenuProps = {
  onClose: () => void;
};

export function SettingsMenu({ onClose }: SettingsMenuProps) {
  const menus = useMenus();
  const [open, setOpen] = useState<string | null>(null);
  const rootRef = useDismiss(true, onClose);
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!rootRef.current?.contains(target) && !target?.closest(".activity-bar__settings")) {
        onClose();
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [onClose, rootRef]);

  const run = (id: string) => {
    onClose();
    runCommand(id);
  };
  const shown = menus.find((menu) => menu.label === open);

  return createPortal(
    <div ref={rootRef} className="settings-menu">
      <div className="menu-popup panel" role="menu" aria-label="Settings and menus">
        <button
          ref={firstRef}
          type="button"
          role="menuitem"
          className="menu-popup__item"
          onClick={() => run("settings.open")}
        >
          <span>Settings…</span>
          <kbd>Ctrl+,</kbd>
        </button>
        <hr className="menu-popup__separator" />
        {menus.map((menu) => (
          <button
            key={menu.label}
            type="button"
            role="menuitem"
            className="menu-popup__item"
            aria-haspopup="menu"
            aria-expanded={open === menu.label}
            onClick={() => setOpen(open === menu.label ? null : menu.label)}
            onPointerEnter={() => setOpen(menu.label)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                setOpen(menu.label);
              }
            }}
          >
            <span>{menu.label}</span>
            <span aria-hidden="true">›</span>
          </button>
        ))}
      </div>
      {shown && (
        <MenuPopup
          label={shown.label}
          items={shown.items}
          onRun={run}
          onClose={() => setOpen(null)}
          className="settings-menu__submenu"
        />
      )}
    </div>,
    document.body,
  );
}
