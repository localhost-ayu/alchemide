import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDismiss } from "../../lib/dismiss";
import { useT } from "../../lib/i18n";
import { useWorkspaceStore } from "./useWorkspaceStore";

export function ExplorerContextMenu() {
  const t = useT();
  const menu = useWorkspaceStore((state) => state.contextMenu);
  const isRoot = useWorkspaceStore((state) => state.contextMenu?.path === state.folder?.path);
  const { closeContextMenu, startCreate, startRename, deletePath } = useWorkspaceStore.getState();
  const menuRef = useDismiss(menu !== null, closeContextMenu);
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menu) {
      return;
    }
    firstRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeContextMenu();
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [menu, menuRef, closeContextMenu]);

  if (!menu) {
    return null;
  }
  const run = (action: () => unknown) => () => {
    closeContextMenu();
    void action();
  };
  const copyPath = () => navigator.clipboard?.writeText(menu.path);

  return createPortal(
    <div
      ref={menuRef}
      className="explorer-menu panel"
      role="menu"
      aria-label={t("explorer.fileActions")}
      style={{ left: menu.x, top: menu.y }}
      onKeyDown={(event) => {
        const items = [
          ...(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []),
        ];
        const index = items.indexOf(document.activeElement as HTMLElement);
        const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
        if (step) {
          event.preventDefault();
          items[(index + step + items.length) % items.length]?.focus();
        }
      }}
    >
      <button ref={firstRef} type="button" role="menuitem" onClick={run(() => startCreate(false))}>
        {t("explorer.newFile")}
      </button>
      <button type="button" role="menuitem" onClick={run(() => startCreate(true))}>
        {t("explorer.newFolder")}
      </button>
      {!isRoot && (
        <>
          <button type="button" role="menuitem" onClick={run(() => startRename(menu.path))}>
            <span>{t("explorer.rename")}</span>
            <kbd>F2</kbd>
          </button>
          <button type="button" role="menuitem" onClick={run(() => deletePath(menu.path))}>
            <span>{t("explorer.delete")}</span>
            <kbd>Del</kbd>
          </button>
        </>
      )}
      <button type="button" role="menuitem" onClick={run(copyPath)}>
        {t("explorer.copyPath")}
      </button>
    </div>,
    document.body,
  );
}
