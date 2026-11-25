import { useEffect, useState } from "react";
import { Editor } from "../features/editor/Editor";
import { Explorer } from "../features/explorer/Explorer";
import { EnvironmentBadge } from "../features/statusbar/EnvironmentBadge";
import "./App.css";

export function App() {
  const [isExplorerOpen, setExplorerOpen] = useState(true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setExplorerOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="app" data-explorer={isExplorerOpen ? "open" : "closed"}>
      <aside className="app__explorer" aria-label="Explorer" hidden={!isExplorerOpen}>
        <Explorer />
      </aside>
      <main className="app__editor" aria-label="Editor">
        <Editor />
      </main>
      <footer className="app__statusbar">
        <span>Status bar</span>
        <EnvironmentBadge />
      </footer>
    </div>
  );
}
