import { LSPPlugin, Workspace, type WorkspaceFile } from "@codemirror/lsp-client";
import type { Text } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { pathFromUri } from "../../lib/fileUri";

type OpenFile = WorkspaceFile & { view: EditorView };
type FileUpdate = ReturnType<Workspace["syncFiles"]>[number];

export type ShowFile = (path: string) => Promise<EditorView | null>;

let showFile: ShowFile | null = null;

export function setShowFile(show: ShowFile | null): void {
  showFile = show;
}

export function isWindowsPath(path: string): boolean {
  return /^[a-z]:|^\\\\/i.test(path);
}

export function matchDriveCase(path: string, root: string): string {
  const drive = root.match(/^[a-z]:/i)?.[0];
  return drive && path.slice(0, 2).toLowerCase() === drive.toLowerCase()
    ? drive + path.slice(2)
    : path;
}

export class EditorWorkspace extends Workspace {
  files: OpenFile[] = [];
  private versions = new Map<string, number>();
  root = "";

  private nextVersion(uri: string): number {
    const version = (this.versions.get(uri) ?? -1) + 1;
    this.versions.set(uri, version);
    return version;
  }

  syncFiles(): readonly FileUpdate[] {
    const updates: FileUpdate[] = [];
    for (const file of this.files) {
      const plugin = LSPPlugin.get(file.view);
      if (!plugin || plugin.uri !== file.uri || plugin.unsyncedChanges.empty) {
        continue;
      }
      const prevDoc: Text = file.doc;
      updates.push({ changes: plugin.unsyncedChanges, file, prevDoc });
      file.doc = file.view.state.doc;
      file.version = this.nextVersion(file.uri);
      plugin.clear();
    }
    return updates;
  }

  openFile(uri: string, languageId: string, view: EditorView): void {
    this.closeFile(uri);
    const file: OpenFile = {
      uri,
      languageId,
      version: this.nextVersion(uri),
      doc: view.state.doc,
      view,
      getView: () => view,
    };
    this.files.push(file);
    this.client.didOpen(file);
  }

  closeFile(uri: string): void {
    if (!this.files.some((file) => file.uri === uri)) {
      return;
    }
    this.files = this.files.filter((file) => file.uri !== uri);
    this.client.didClose(uri);
  }

  async displayFile(uri: string): Promise<EditorView | null> {
    const path = pathFromUri(uri, isWindowsPath(this.root));
    if (!path || !showFile) {
      return null;
    }
    return showFile(matchDriveCase(path, this.root));
  }
}
