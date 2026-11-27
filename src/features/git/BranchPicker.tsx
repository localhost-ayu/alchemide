import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDismiss } from "../../lib/dismiss";
import { useT } from "../../lib/i18n";
import { timeAgo } from "../../lib/timeAgo";
import type { Branch } from "../../lib/types";
import { type BranchOption, branchOptions, localName } from "./branchOptions";
import { useGitStore } from "./useGitStore";

type BranchPickerProps = {
  current: string;
};

export function BranchPicker({ current }: BranchPickerProps) {
  const t = useT();
  const branches = useGitStore((state) => state.branches);
  const { switchBranch, createBranch } = useGitStore.getState();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useDismiss(open, () => setOpen(false));
  const options = branchOptions(branches, query);

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

  const choose = (option: BranchOption | undefined) => {
    if (!option) {
      return;
    }
    setOpen(false);
    setQuery("");
    if (option.kind === "create") {
      void createBranch(option.name);
    } else if (!option.branch.current) {
      void switchBranch(localName(option.branch));
    }
  };

  const box = buttonRef.current?.getBoundingClientRect();
  const row = (branch: Branch, position: number) => (
    <li key={`${branch.remote}:${branch.name}`}>
      <button
        type="button"
        className="branch-picker__item"
        data-highlighted={position === index}
        aria-current={branch.current ? "true" : undefined}
        data-current={branch.current}
        onPointerEnter={() => setIndex(position)}
        onClick={() => choose(options[position])}
      >
        <span className="branch-picker__name">
          <span aria-hidden="true">{branch.current ? "✓" : branch.remote ? "☁" : "⎇"}</span>{" "}
          {branch.name}
        </span>
        <span className="branch-picker__meta">
          {t("git.branchMeta", {
            author: branch.author,
            age: timeAgo(branch.time, Date.now() / 1000),
            subject: branch.subject,
          })}
        </span>
      </button>
    </li>
  );

  const section = (remote: boolean) => {
    const rows = options
      .map((option, at) => ({ option, at }))
      .filter(({ option }) => option.kind === "branch" && option.branch.remote === remote);
    if (rows.length === 0) {
      return null;
    }
    return (
      <li className="branch-picker__section">
        <h4>{t(remote ? "git.remoteBranches" : "git.localBranches")}</h4>
        <ul>
          {rows.map(({ option, at }) => (option.kind === "branch" ? row(option.branch, at) : null))}
        </ul>
      </li>
    );
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="git-dock__branch-button"
        aria-label={t("git.branch")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setIndex(0);
        }}
      >
        ⎇ {current} ▾
      </button>
      {open &&
        box &&
        createPortal(
          <div
            ref={panelRef}
            className="branch-picker panel"
            role="dialog"
            aria-label={t("git.branchPicker")}
            style={{
              top: box.bottom + 4,
              left: Math.max(8, Math.min(box.left, window.innerWidth - 348)),
            }}
          >
            <ul className="branch-picker__list" aria-label={t("git.branchPicker")}>
              {options[0]?.kind === "create" && (
                <li>
                  <button
                    type="button"
                    className="branch-picker__item"
                    data-highlighted={index === 0}
                    onClick={() => choose(options[0])}
                  >
                    <span className="branch-picker__name">
                      + {t("git.createBranch", { name: options[0].name })}
                    </span>
                  </button>
                </li>
              )}
              {section(false)}
              {section(true)}
              {options.length === 0 && (
                <li className="branch-picker__empty">{t("git.noBranches")}</li>
              )}
            </ul>
            <input
              // biome-ignore lint/a11y/noAutofocus: the picker opens to type a branch name
              autoFocus
              className="branch-picker__search"
              aria-label={t("git.branchSearch")}
              placeholder={t("git.branchSearch")}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setIndex(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  const step = event.key === "ArrowDown" ? 1 : -1;
                  setIndex((index + step + options.length) % Math.max(options.length, 1));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  choose(options[index]);
                }
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
