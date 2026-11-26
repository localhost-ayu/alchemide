import { useEffect, useMemo } from "react";
import { useEditorStore } from "../../lib/editorStore";
import { MatchPreview } from "./MatchPreview";
import { connectSearchEvents, groupByFile, matchKey, useSearchStore } from "./useSearchStore";
import "./Search.css";

function summary(results: number, files: number, truncated: boolean): string {
  if (results === 0) {
    return "No results";
  }
  const base = `${results} ${results === 1 ? "result" : "results"} in ${files} ${files === 1 ? "file" : "files"}`;
  return truncated ? `${base} (showing the first ${results})` : base;
}

export function SearchPanel() {
  const query = useSearchStore((state) => state.query);
  const replacement = useSearchStore((state) => state.replacement);
  const results = useSearchStore((state) => state.results);
  const status = useSearchStore((state) => state.status);
  const truncated = useSearchStore((state) => state.truncated);
  const error = useSearchStore((state) => state.error);
  const excluded = useSearchStore((state) => state.excluded);
  const { setQuery, setReplacement, run, toggleMatch, replaceSelected } = useSearchStore.getState();
  const groups = useMemo(() => groupByFile(results), [results]);
  const selectedCount = results.filter((match) => !excluded[matchKey(match)]).length;

  useEffect(() => connectSearchEvents(), []);

  const replace = async () => {
    const message = `Replace ${selectedCount} selected ${selectedCount === 1 ? "match" : "matches"}? This writes the files on disk.`;
    if (!window.confirm(message)) {
      return;
    }
    const outcome = await replaceSelected();
    if (outcome.skipped.length > 0) {
      window.alert(`Skipped files with unsaved changes: ${outcome.skipped.join(", ")}`);
    }
  };

  return (
    <div className="search">
      <h2 className="search__title">Search</h2>
      <div className="search__form">
        <div className="search__row">
          <input
            className="search__input"
            aria-label="Search in files"
            placeholder="Search"
            value={query.text}
            onChange={(event) => setQuery({ text: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                run();
              }
            }}
          />
          <button
            type="button"
            className="search__toggle"
            aria-label="Match case"
            aria-pressed={query.caseSensitive}
            onClick={() => {
              setQuery({ caseSensitive: !query.caseSensitive });
              run();
            }}
          >
            Aa
          </button>
          <button
            type="button"
            className="search__toggle"
            aria-label="Use regular expression"
            aria-pressed={query.regex}
            onClick={() => {
              setQuery({ regex: !query.regex });
              run();
            }}
          >
            .*
          </button>
        </div>
        <div className="search__row">
          <input
            className="search__input"
            aria-label="Replace with"
            placeholder="Replace"
            value={replacement}
            onChange={(event) => setReplacement(event.target.value)}
          />
          <button
            type="button"
            className="search__replace"
            disabled={selectedCount === 0 || status === "searching"}
            onClick={replace}
          >
            Replace
          </button>
        </div>
      </div>
      <p className="search__status" role="status">
        {error ??
          (status === "searching"
            ? "Searching…"
            : status === "done"
              ? summary(results.length, groups.length, truncated)
              : "")}
      </p>
      <ul className="search__results" aria-label="Search results">
        {groups.map((group) => (
          <li key={group.path}>
            <div className="search__file" title={group.path}>
              {group.relative}
              <span className="search__count">{group.matches.length}</span>
            </div>
            <ul>
              {group.matches.map((match) => (
                <li key={matchKey(match)} className="search-match">
                  <input
                    type="checkbox"
                    aria-label={`Include line ${match.line} of ${group.relative}`}
                    checked={!excluded[matchKey(match)]}
                    onChange={() => toggleMatch(match)}
                  />
                  <button
                    type="button"
                    className="search-match__open"
                    onClick={() => useEditorStore.getState().openAt(match.path, match.line)}
                  >
                    <span className="search-match__line">{match.line}</span>
                    <MatchPreview match={match} />
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
