import { Explorer } from "../features/explorer/Explorer";
import { EnvironmentBadge } from "../features/statusbar/EnvironmentBadge";
import "./App.css";

export function App() {
  return (
    <div className="app">
      <aside className="app__explorer" aria-label="Explorer">
        <Explorer />
      </aside>
      <main className="app__editor" aria-label="Editor">
        Editor
      </main>
      <footer className="app__statusbar">
        <span>Status bar</span>
        <EnvironmentBadge />
      </footer>
    </div>
  );
}
