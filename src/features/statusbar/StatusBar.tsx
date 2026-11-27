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
    </div>
  );
}
