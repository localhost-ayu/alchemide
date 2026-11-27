import { runCommand } from "../../lib/commands";
import { selectActiveTab, useEditorStore } from "../../lib/editorStore";
import { languageLabel } from "../../lib/languages";
import { ActivityIndicator } from "./ActivityIndicator";
import { EnvironmentBadge } from "./EnvironmentBadge";
import { formatEncoding, formatLineCount, formatPosition } from "./formatStatus";
import { LanguageServerBadge } from "./LanguageServerBadge";
import "./StatusBar.css";

export function StatusBar() {
  const tab = useEditorStore(selectActiveTab);
  const cursor = useEditorStore((state) => state.cursor);

  return (
    <div className="statusbar">
      <div className="statusbar__left">
        <EnvironmentBadge />
        <ActivityIndicator />
      </div>
      <div className="statusbar__right">
        {tab && cursor && (
          <div className="statusbar__file">
            <span>{formatPosition(cursor)}</span>
            <span>{formatLineCount(cursor.lineCount)}</span>
            <span>{formatEncoding(tab.hasBom)}</span>
            <span>{tab.lineEnding}</span>
            <span>{languageLabel(tab.language)}</span>
            <LanguageServerBadge language={tab.language} />
          </div>
        )}
        <button
          type="button"
          className="statusbar__terminal"
          aria-label="Toggle terminal"
          title="Terminal (Ctrl+`)"
          onClick={() => runCommand("terminal.toggle")}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <rect
              x="1.5"
              y="2.5"
              width="13"
              height="11"
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="m4.5 6 2 2-2 2M8.5 10.5h3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
