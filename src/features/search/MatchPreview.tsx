import type { SearchMatch } from "../../lib/types";

type MatchPreviewProps = {
  match: SearchMatch;
};

export function MatchPreview({ match }: MatchPreviewProps) {
  const parts: { text: string; highlighted: boolean; start: number }[] = [];
  let cursor = 0;
  for (const [start, end] of match.ranges) {
    if (start > cursor) {
      parts.push({ text: match.preview.slice(cursor, start), highlighted: false, start: cursor });
    }
    parts.push({ text: match.preview.slice(start, end), highlighted: true, start });
    cursor = end;
  }
  parts.push({ text: match.preview.slice(cursor), highlighted: false, start: cursor });

  return (
    <span className="search-match__preview">
      {parts.map((part) =>
        part.highlighted ? (
          <mark key={part.start}>{part.text}</mark>
        ) : (
          <span key={part.start}>{part.text}</span>
        ),
      )}
    </span>
  );
}
