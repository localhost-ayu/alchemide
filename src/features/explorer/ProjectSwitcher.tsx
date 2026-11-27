import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDismiss } from "../../lib/dismiss";
import { useT } from "../../lib/i18n";
import { recentFolders } from "../../lib/ipc";
import type { Folder } from "../../lib/types";
import { useWorkspaceStore } from "./useWorkspaceStore";

export function matchFolders(folders: Folder[], query: string): Folder[] {
  const needle = query.trim().toLowerCase();
  return folders.filter(
    (folder) =>
      folder.name.toLowerCase().includes(needle) || folder.path.toLowerCase().includes(needle),
  );
}

type ProjectSwitcherProps = {
  current: Folder;
  openRequest: number;
};

export function ProjectSwitcher({ current, openRequest }: ProjectSwitcherProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useDismiss(open, () => setOpen(false));
  const matches = matchFolders(folders, query);

  const show = useCallback(() => {
    setQuery("");
    setIndex(0);
    setOpen(true);
    recentFolders()
      .then(setFolders)
      .catch(() => setFolders([]));
  }, []);

  useEffect(() => {
    if (openRequest > 0) {
      show();
    }
  }, [openRequest, show]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, panelRef]);

  const choose = (folder: Folder | undefined) => {
    setOpen(false);
    if (folder && folder.path !== current.path) {
      void useWorkspaceStore.getState().openRecent(folder.path);
    }
  };
  const box = buttonRef.current?.getBoundingClientRect();

  return (
    <>
      <h2 className="explorer__title" title={current.path}>
        <button
          ref={buttonRef}
          type="button"
          className="explorer__project"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => (open ? setOpen(false) : show())}
        >
          {current.name}
          <span aria-hidden="true"> ▾</span>
        </button>
      </h2>
      {open &&
        box &&
        createPortal(
          <div
            ref={panelRef}
            className="project-switcher panel"
            role="dialog"
            aria-label={t("projects.title")}
            style={{ top: box.bottom + 4, left: Math.max(8, box.left) }}
          >
            <input
              // biome-ignore lint/a11y/noAutofocus: the switcher opens to search projects
              autoFocus
              className="project-switcher__search"
              aria-label={t("projects.search")}
              placeholder={t("projects.search")}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setIndex(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  const step = event.key === "ArrowDown" ? 1 : -1;
                  setIndex((index + step + matches.length) % Math.max(matches.length, 1));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  choose(matches[index]);
                }
              }}
            />
            <h4>{t("projects.recent")}</h4>
            <ul className="project-switcher__list" aria-label={t("projects.recent")}>
              {matches.map((folder, position) => (
                <li key={folder.path}>
                  <button
                    type="button"
                    className="project-switcher__item"
                    data-highlighted={position === index}
                    aria-current={folder.path === current.path ? "true" : undefined}
                    title={folder.path}
                    onPointerEnter={() => setIndex(position)}
                    onClick={() => choose(folder)}
                  >
                    <span>{folder.name}</span>
                    <small>{folder.path}</small>
                  </button>
                </li>
              ))}
              {matches.length === 0 && (
                <li className="project-switcher__empty">{t("projects.none")}</li>
              )}
            </ul>
            <button
              type="button"
              className="project-switcher__open"
              onClick={() => {
                setOpen(false);
                void useWorkspaceStore.getState().pickFolder();
              }}
            >
              {t("projects.openFolder")}
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
