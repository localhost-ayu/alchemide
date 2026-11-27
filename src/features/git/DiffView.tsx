import { useT } from "../../lib/i18n";
import { classifyDiffLine } from "./diffLines";

type DiffViewProps = {
  diff: string;
};

export function DiffView({ diff }: DiffViewProps) {
  const t = useT();
  const lines = diff.replace(/\n$/, "").split("\n");
  if (!diff.trim()) {
    return <p className="git-dock__empty">{t("git.noDifferences")}</p>;
  }
  return (
    <section aria-label={t("git.diff")}>
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
