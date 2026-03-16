import * as vscode from "vscode";
import { ApiClient, Memory } from "../api";

/**
 * Shows memories relevant to the currently active file/project.
 * Auto-refreshes when the active editor changes.
 */
export class RelevantMemoryProvider implements vscode.TreeDataProvider<RelevantItem> {
  private _onDidChange = new vscode.EventEmitter<RelevantItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  private memories: Memory[] = [];
  private lastQuery = "";
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private api: ApiClient) {
    // Auto-refresh when active editor changes
    vscode.window.onDidChangeActiveTextEditor(() => this.debouncedRefresh());
  }

  private debouncedRefresh(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.refresh(), 1500);
  }

  async refresh(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // Build context query from file info
    const fileName = editor.document.fileName.split("/").pop() || "";
    const langId = editor.document.languageId;
    const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name || "";

    // Use selection if available, otherwise file name + language
    const selection = editor.document.getText(editor.selection);
    const query = selection?.trim()
      ? selection.slice(0, 200)
      : `${workspaceName} ${fileName} ${langId}`.trim();

    if (query === this.lastQuery) return;
    this.lastQuery = query;

    try {
      const result = await this.api.searchMemories(query, 8);
      this.memories = result.memories || [];
    } catch {
      this.memories = [];
    }
    this._onDidChange.fire(undefined);
  }

  getTreeItem(element: RelevantItem): vscode.TreeItem {
    return element;
  }

  getChildren(): RelevantItem[] {
    if (!this.memories.length) {
      return [new RelevantItem("No relevant memories for this file", "", vscode.TreeItemCollapsibleState.None)];
    }
    return this.memories.map((m) => {
      const preview = m.content.replace(/\n/g, " ").slice(0, 80);
      const item = new RelevantItem(preview, m.id, vscode.TreeItemCollapsibleState.None, m);
      item.tooltip = m.content;
      item.description = m.tags?.length ? m.tags.slice(0, 3).join(", ") : undefined;
      return item;
    });
  }
}

export class RelevantItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly memoryId: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly memory?: Memory,
  ) {
    super(label, collapsibleState);
    if (memory) {
      this.contextValue = "memory";
      this.iconPath = new vscode.ThemeIcon("lightbulb");
    }
  }
}
