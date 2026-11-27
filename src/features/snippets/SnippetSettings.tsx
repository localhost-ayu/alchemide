import { useActivityStore } from "../../lib/activityStore";
import { SNIPPET_PACKS } from "../../lib/snippetPacks";
import { useSnippetStore } from "../../lib/snippetStore";
import { importMessage } from "./importMessage";

export function SnippetSettings() {
  const enabledPacks = useSnippetStore((state) => state.enabledPacks);
  const userSnippets = useSnippetStore((state) => state.userSnippets);
  const problems = useSnippetStore((state) => state.problems);
  const setPack = useSnippetStore((state) => state.setPack);

  const importFromVscode = async () => {
    const result = await useSnippetStore.getState().importFromVscode();
    useActivityStore.getState().notify(importMessage(result));
  };

  return (
    <section className="settings__section">
      <h3>Snippets</h3>
      {SNIPPET_PACKS.map((pack) => (
        <label key={pack.id} className="settings__field settings__field--check">
          <input
            type="checkbox"
            checked={enabledPacks.includes(pack.id)}
            onChange={(event) => setPack(pack.id, event.target.checked)}
          />
          <span>
            {pack.name} <small>({pack.snippets.length})</small>
          </span>
        </label>
      ))}
      <div className="settings__field">
        <span>
          {userSnippets.length === 1
            ? "1 snippet of yours"
            : `${userSnippets.length} snippets of yours`}
        </span>
        <button type="button" onClick={importFromVscode}>
          Import from VS Code
        </button>
      </div>
      {problems.map((problem) => (
        <p key={problem} className="settings__problem" role="alert">
          {problem}
        </p>
      ))}
    </section>
  );
}
