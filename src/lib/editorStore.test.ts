import { beforeEach, expect, test } from "vitest";
import { selectActiveTab, selectActiveText, useEditorStore } from "./editorStore";

const root = "/home/user/sample-project";

beforeEach(() => {
  useEditorStore.setState({
    tabs: [],
    activePath: null,
    cursor: null,
    drafts: {},
    scroll: 0,
    error: null,
  });
});

test("activates a file that is already open instead of opening it twice", async () => {
  const { openFile } = useEditorStore.getState();
  await openFile(`${root}/query.sql`);
  await openFile(`${root}/README.md`);

  await openFile(`${root}/query.sql`);

  const state = useEditorStore.getState();
  expect(state.tabs.map((tab) => tab.name)).toEqual(["query.sql", "README.md"]);
  expect(selectActiveTab(state)?.name).toBe("query.sql");
});

test("activates the neighbor tab when the active one closes", async () => {
  const { openFile } = useEditorStore.getState();
  await openFile(`${root}/query.sql`);
  await openFile(`${root}/README.md`);
  await openFile(`${root}/index.php`);
  useEditorStore.getState().activate(`${root}/README.md`);

  useEditorStore.getState().closeTab(`${root}/README.md`);
  expect(selectActiveTab(useEditorStore.getState())?.name).toBe("index.php");

  useEditorStore.getState().closeTab(`${root}/index.php`);
  expect(selectActiveTab(useEditorStore.getState())?.name).toBe("query.sql");

  useEditorStore.getState().closeTab(`${root}/query.sql`);
  expect(useEditorStore.getState().activePath).toBeNull();
});

test("detects the language and line ending of an opened file", async () => {
  await useEditorStore.getState().openFile(`${root}/src/App.tsx`);

  const tab = selectActiveTab(useEditorStore.getState());
  expect(tab?.language).toBe("tsx");
  expect(tab?.lineEnding).toBe("LF");
});

test("keeps drafts only for open tabs and clamps the scroll position", async () => {
  await useEditorStore.getState().openFile(`${root}/README.md`);
  useEditorStore.getState().setDraft(`${root}/README.md`, "# Draft");
  expect(selectActiveText(useEditorStore.getState())).toBe("# Draft");

  useEditorStore.getState().closeTab(`${root}/README.md`);
  expect(useEditorStore.getState().drafts).toEqual({});

  useEditorStore.getState().setScroll(1.4);
  expect(useEditorStore.getState().scroll).toBe(1);
});
