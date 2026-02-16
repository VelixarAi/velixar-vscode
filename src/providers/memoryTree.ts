import * as vscode from "vscode";
import { ApiClient, Memory } from "../api";

const TIER_LABELS: Record<number, string> = {
  0: "⚡ Pinned",
  1: "💬 Session",
  2: "🧠 Semantic",
  3: "🏢 Organization",
};

const TIER_ICONS: Record<number, vscode.ThemeIcon> = {
  0: new vscode.ThemeIcon("pin"),
  1: new vscode.ThemeIcon("comment"),
  2: new vscode.ThemeIcon("search"),
  3: new vscode.ThemeIcon("organization"),
};

export class MemoryTreeProvider implements vscode.TreeDataProvider<MemoryItem> {
  private _onDidChange = new vscode.EventEmitter<MemoryItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  private memories: Memory[] = [];
  private groupByTier = true;

  constructor(private api: ApiClient) {}

  async refresh(): Promise<void> {
    try {
      const result = await this.api.listMemories(100);
      this.memories = result.memories || [];
    } catch (e: any) {
      this.memories = [];
      if (e.message?.includes("API key")) {
        // Silent — user hasn't set key yet
      } else {
        vscode.window.showErrorMessage(`Velixar: ${e.message}`);
      }
    }
    this._onDidChange.fire(undefined);
  }

  getTreeItem(element: MemoryItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: MemoryItem): MemoryItem[] {
    if (!element) {
      // Root level — group by tier
      const tiers = new Map<number, Memory[]>();
      for (const m of this.memories) {
        const t = m.tier ?? 2;
        if (!tiers.has(t)) tiers.set(t, []);
        tiers.get(t)!.push(m);
      }

      if (tiers.size === 0) {
        return [new MemoryItem("No memories yet", "", vscode.TreeItemCollapsibleState.None)];
      }

      return [...tiers.entries()]
        .sort(([a], [b]) => a - b)
        .map(
          ([tier, mems]) =>
            new MemoryItem(
              `${TIER_LABELS[tier] || `Tier ${tier}`} (${mems.length})`,
              "",
              vscode.TreeItemCollapsibleState.Expanded,
              undefined,
              TIER_ICONS[tier],
              mems
            )
        );
    }

    // Children of a tier group
    return (element.children || []).map((m) => {
      const preview = m.content.replace(/\n/g, " ").slice(0, 80);
      const item = new MemoryItem(
        preview,
        m.id,
        vscode.TreeItemCollapsibleState.None,
        m
      );
      item.tooltip = m.content;
      item.description = m.created_at
        ? new Date(m.created_at).toLocaleDateString()
        : undefined;
      return item;
    });
  }
}

export class MemoryItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly memoryId: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly memory?: Memory,
    icon?: vscode.ThemeIcon,
    public readonly children?: Memory[]
  ) {
    super(label, collapsibleState);
    if (icon) this.iconPath = icon;
    if (memory) {
      this.contextValue = "memory";
      this.iconPath = new vscode.ThemeIcon("note");
    }
  }
}
