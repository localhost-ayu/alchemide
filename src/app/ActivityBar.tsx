import { type ReactNode, useCallback, useState } from "react";
import { type SidebarView, useLayoutStore } from "../lib/layoutStore";
import { Icon } from "./Icon";
import { SettingsMenu } from "./SettingsMenu";

const VIEWS: { view: SidebarView; label: string; keys: string; icon: ReactNode }[] = [
  {
    view: "explorer",
    label: "Explorer",
    keys: "Ctrl+Shift+E",
    icon: (
      <Icon>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
      </Icon>
    ),
  },
  {
    view: "search",
    label: "Search",
    keys: "Ctrl+Shift+F",
    icon: (
      <Icon>
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.5-4.5" />
      </Icon>
    ),
  },
  {
    view: "docker",
    label: "Docker",
    keys: "Ctrl+Shift+D",
    icon: (
      <Icon>
        <path d="M3 13h16a3 3 0 0 0 2-1 4 4 0 0 1-3 7H8a5 5 0 0 1-5-6z" />
        <path d="M6 10h3v3H6zM9 10h3v3H9zM12 10h3v3h-3zM9 7h3v3H9z" />
      </Icon>
    ),
  },
];

export function ActivityBar() {
  const sidebar = useLayoutStore((state) => state.sidebar);
  const sidebarOpen = useLayoutStore((state) => state.sidebarOpen);
  const toggleView = useLayoutStore((state) => state.toggleView);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <nav className="activity-bar" aria-label="Activity bar">
      {VIEWS.map(({ view, label, keys, icon }) => (
        <button
          key={view}
          type="button"
          className="activity-bar__item"
          aria-label={label}
          aria-pressed={sidebarOpen && sidebar === view}
          title={`${label} (${keys})`}
          onClick={() => toggleView(view)}
        >
          {icon}
        </button>
      ))}
      <button
        type="button"
        className="activity-bar__item activity-bar__settings"
        aria-label="Settings and menus"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title="Settings and menus"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <Icon>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </Icon>
      </button>
      {menuOpen && <SettingsMenu onClose={closeMenu} />}
    </nav>
  );
}
