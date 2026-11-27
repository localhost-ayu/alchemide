import { type KeyboardEvent, useEffect, useRef } from "react";
import type { MenuItem } from "./menus";

type MenuPopupProps = {
  label: string;
  items: MenuItem[];
  onRun: (id: string) => void;
  onClose: () => void;
  className?: string;
  focusFirst?: boolean;
};

function moveFocus(menu: HTMLElement | null, step: number | "first" | "last"): void {
  const items = [...(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
  if (items.length === 0) {
    return;
  }
  const current = items.indexOf(document.activeElement as HTMLElement);
  const index =
    step === "first"
      ? 0
      : step === "last"
        ? items.length - 1
        : (current + step + items.length) % items.length;
  items[index]?.focus();
}

export function MenuPopup({ label, items, onRun, onClose, className, focusFirst }: MenuPopupProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusFirst) {
      moveFocus(menuRef.current, "first");
    }
  }, [focusFirst]);

  const onKeyDown = (event: KeyboardEvent) => {
    const steps: Record<string, number | "first" | "last"> = {
      ArrowDown: 1,
      ArrowUp: -1,
      Home: "first",
      End: "last",
    };
    const step = steps[event.key];
    if (step !== undefined) {
      event.preventDefault();
      moveFocus(menuRef.current, step);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className={`menu-popup panel ${className ?? ""}`}
      role="menu"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          className="menu-popup__item"
          onClick={() => onRun(item.id)}
        >
          <span>{item.title}</span>
          {item.keys && <kbd>{item.keys}</kbd>}
        </button>
      ))}
    </div>
  );
}
