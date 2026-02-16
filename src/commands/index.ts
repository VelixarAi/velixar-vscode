import * as vscode from "vscode";
import { ApiClient } from "../api";
import { MemoryItem } from "../providers/memoryTree";

export function registerCommands(
  context: vscode.ExtensionContext,
  api: ApiClient,
  refreshAll: () => Promise<void>
): void {
  // Set API Key
  context.subscriptions.push(
    vscode.commands.registerCommand("velixar.setApiKey", async () => {
      const key = await vscode.window.showInputBox({
        prompt: "Enter your Velixar API key",
        placeHolder: "vlx_...",
        password: true,
        validateInput: (v) => (v.startsWith("vlx_") ? null : "Key must start with vlx_"),
      });
      if (key) {
        await api.setApiKey(key);
        vscode.window.showInformationMessage("Velixar API key saved");
        await refreshAll();
      }
    })
  );

  // Store selection as memory
  context.subscriptions.push(
    vscode.commands.registerCommand("velixar.storeMemory", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.document.getText(editor.selection);
      if (!selection) {
        vscode.window.showWarningMessage("Select text first");
        return;
      }

      const tier = vscode.workspace.getConfiguration("velixar").get<number>("defaultTier", 2);

      const tags = await vscode.window.showInputBox({
        prompt: "Tags (comma-separated, optional)",
        placeHolder: "code, snippet, reference",
      });

      try {
        const result = await api.storeMemory(
          selection,
          tier,
          tags ? tags.split(",").map((t) => t.trim()) : undefined
        );
        vscode.window.showInformationMessage(`Memory stored: ${result.id.slice(0, 8)}...`);
        await refreshAll();
      } catch (e: any) {
        vscode.window.showErrorMessage(`Velixar: ${e.message}`);
      }
    })
  );

  // Search memories (quick pick)
  context.subscriptions.push(
    vscode.commands.registerCommand("velixar.searchMemories", async () => {
      const query = await vscode.window.showInputBox({
        prompt: "Search your memories",
        placeHolder: "What are you looking for?",
      });
      if (!query) return;

      try {
        const result = await api.searchMemories(query, 10);
        if (!result.memories?.length) {
          vscode.window.showInformationMessage("No memories found");
          return;
        }

        const pick = await vscode.window.showQuickPick(
          result.memories.map((m) => ({
            label: m.content.replace(/\n/g, " ").slice(0, 100),
            detail: `ID: ${m.id.slice(0, 8)}... | Score: ${m.score?.toFixed(2) || "—"}`,
            memory: m,
          })),
          { placeHolder: `${result.count} results` }
        );

        if (pick) {
          const action = await vscode.window.showQuickPick(
            ["Copy to clipboard", "Insert at cursor", "Open in editor"],
            { placeHolder: "What do you want to do?" }
          );

          if (action === "Copy to clipboard") {
            await vscode.env.clipboard.writeText(pick.memory.content);
            vscode.window.showInformationMessage("Copied");
          } else if (action === "Insert at cursor") {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              editor.edit((edit) => edit.insert(editor.selection.active, pick.memory.content));
            }
          } else if (action === "Open in editor") {
            const doc = await vscode.workspace.openTextDocument({
              content: pick.memory.content,
              language: "markdown",
            });
            await vscode.window.showTextDocument(doc);
          }
        }
      } catch (e: any) {
        vscode.window.showErrorMessage(`Velixar: ${e.message}`);
      }
    })
  );

  // Refresh
  context.subscriptions.push(
    vscode.commands.registerCommand("velixar.refreshMemories", refreshAll)
  );

  // Delete memory
  context.subscriptions.push(
    vscode.commands.registerCommand("velixar.deleteMemory", async (item: MemoryItem) => {
      if (!item?.memoryId) return;
      const confirm = await vscode.window.showWarningMessage(
        `Delete memory ${item.memoryId.slice(0, 8)}...?`,
        { modal: true },
        "Delete"
      );
      if (confirm === "Delete") {
        try {
          await api.deleteMemory(item.memoryId);
          vscode.window.showInformationMessage("Memory deleted");
          await refreshAll();
        } catch (e: any) {
          vscode.window.showErrorMessage(`Velixar: ${e.message}`);
        }
      }
    })
  );

  // Copy memory
  context.subscriptions.push(
    vscode.commands.registerCommand("velixar.copyMemory", async (item: MemoryItem) => {
      if (!item?.memory) return;
      await vscode.env.clipboard.writeText(item.memory.content);
      vscode.window.showInformationMessage("Memory copied");
    })
  );

  // Insert memory at cursor
  context.subscriptions.push(
    vscode.commands.registerCommand("velixar.insertMemory", async (item: MemoryItem) => {
      if (!item?.memory) return;
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.edit((edit) => edit.insert(editor.selection.active, item.memory!.content));
      }
    })
  );
}
