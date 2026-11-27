import { classifyDiffLine } from "./diffLines";

type DiffViewProps = {
  diff: string;
};

export function DiffView({ diff }: DiffViewProps) {
  const lines = diff.replace(/\n$/, "").split("\n");
  if (!diff.trim()) {
    return <p className="git-dock__empty">No differences</p>;
  }
  return (
    <section aria-label="Diff">
      <pre className="git-diff">
        {lines.map((line, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: diff lines have no identity besides their position
          <span key={index} className={`git-diff__line git-diff__line--${classifyDiffLine(line)}`}>
            {line || " "}
            {"\n"}
          </span>
        ))}
      </pre>
    </section>
  );
}
