import * as vscode from "vscode";
import { ApiClient } from "./api";
import { MemoryTreeProvider } from "./providers/memoryTree";
import { UsageTreeProvider } from "./providers/usageTree";
import { SearchViewProvider } from "./views/searchView";
import { registerCommands } from "./commands";

export function activate(context: vscode.ExtensionContext) {
  const api = new ApiClient(context.secrets);

  // Providers
  const memoryTree = new MemoryTreeProvider(api);
  const usageTree = new UsageTreeProvider(api);
  const searchView = new SearchViewProvider(api, context.extensionUri);

  // Register tree views
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("velixar.memories", memoryTree),
    vscode.window.registerTreeDataProvider("velixar.usage", usageTree),
    vscode.window.registerWebviewViewProvider(SearchViewProvider.viewType, searchView)
  );

  // Register commands
  const refreshAll = async () => {
    await Promise.all([memoryTree.refresh(), usageTree.refresh()]);
  };
  registerCommands(context, api, refreshAll);

  // Initial load
  refreshAll();

  // Auto-refresh every 60s
  const interval = setInterval(() => refreshAll(), 60_000);
  context.subscriptions.push({ dispose: () => clearInterval(interval) });
}

export function deactivate() {}
