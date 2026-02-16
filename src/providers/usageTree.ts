import * as vscode from "vscode";
import { ApiClient } from "../api";

export class UsageTreeProvider implements vscode.TreeDataProvider<UsageItem> {
  private _onDidChange = new vscode.EventEmitter<UsageItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  private healthy = false;
  private qdrant = false;
  private redis = false;
  private hasKey = false;

  constructor(private api: ApiClient) {}

  async refresh(): Promise<void> {
    this.hasKey = !!(await this.api.getApiKey());
    try {
      const h = await this.api.getHealth();
      this.healthy = h.status === "healthy";
      this.qdrant = h.qdrant;
      this.redis = h.redis;
    } catch {
      this.healthy = false;
    }
    this._onDidChange.fire(undefined);
  }

  getTreeItem(el: UsageItem): vscode.TreeItem {
    return el;
  }

  getChildren(): UsageItem[] {
    const items: UsageItem[] = [];

    // Auth status
    if (this.hasKey) {
      items.push(new UsageItem("API Key", "Connected", "pass"));
    } else {
      items.push(new UsageItem("API Key", "Not set — click to configure", "error", "velixar.setApiKey"));
    }

    // Service health
    items.push(new UsageItem("API", this.healthy ? "Healthy" : "Unreachable", this.healthy ? "pass" : "error"));
    items.push(new UsageItem("Qdrant", this.qdrant ? "Connected" : "Down", this.qdrant ? "pass" : "warning"));
    items.push(new UsageItem("Redis", this.redis ? "Connected" : "Down", this.redis ? "pass" : "warning"));

    return items;
  }
}

class UsageItem extends vscode.TreeItem {
  constructor(label: string, status: string, icon: "pass" | "error" | "warning", command?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = status;
    this.iconPath = new vscode.ThemeIcon(
      icon === "pass" ? "check" : icon === "error" ? "error" : "warning"
    );
    if (command) {
      this.command = { command, title: label };
    }
  }
}
