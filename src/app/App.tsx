import "./App.css";

export function App() {
  return (
    <div className="app">
      <aside className="app__explorer" aria-label="Explorer">
        Explorer
      </aside>
      <main className="app__editor" aria-label="Editor">
        Editor
      </main>
      <footer className="app__statusbar" aria-label="Status bar">
        Status bar
      </footer>
    </div>
  );
}
