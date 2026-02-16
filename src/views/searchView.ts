import * as vscode from "vscode";
import { ApiClient } from "../api";

export class SearchViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "velixar.search";

  constructor(private api: ApiClient, private extensionUri: vscode.Uri) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    view.webview.options = { enableScripts: true };
    view.webview.html = this.getHtml();

    view.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "search") {
        try {
          const result = await this.api.searchMemories(msg.query, 20);
          view.webview.postMessage({ type: "results", data: result });
        } catch (e: any) {
          view.webview.postMessage({ type: "error", message: e.message });
        }
      } else if (msg.type === "copy") {
        await vscode.env.clipboard.writeText(msg.content);
        vscode.window.showInformationMessage("Memory copied to clipboard");
      } else if (msg.type === "insert") {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          editor.edit((edit) => edit.insert(editor.selection.active, msg.content));
        }
      }
    });
  }

  private getHtml(): string {
    return /*html*/ `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 8px; margin: 0; }
  input { width: 100%; padding: 6px 8px; box-sizing: border-box; background: var(--vscode-input-background);
    color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 3px; margin-bottom: 8px; }
  input:focus { outline: 1px solid var(--vscode-focusBorder); }
  .memory { padding: 8px; margin: 4px 0; background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border);
    border-radius: 4px; cursor: pointer; font-size: 12px; line-height: 1.4; white-space: pre-wrap; word-break: break-word; }
  .memory:hover { border-color: var(--vscode-focusBorder); }
  .meta { font-size: 10px; color: var(--vscode-descriptionForeground); margin-top: 4px; }
  .actions { display: flex; gap: 4px; margin-top: 4px; }
  .actions button { font-size: 10px; padding: 2px 6px; background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground); border: none; border-radius: 2px; cursor: pointer; }
  .actions button:hover { background: var(--vscode-button-secondaryHoverBackground); }
  .count { font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 6px; }
  .empty { text-align: center; color: var(--vscode-descriptionForeground); padding: 20px 0; }
  .tier { display: inline-block; font-size: 9px; padding: 1px 4px; border-radius: 2px;
    background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
</style>
</head>
<body>
  <input id="q" type="text" placeholder="Search memories..." autofocus />
  <div id="results"><div class="empty">Type to search your memories</div></div>
  <script>
    const vscode = acquireVsCodeApi();
    const q = document.getElementById('q');
    const results = document.getElementById('results');
    let timer;

    const TIERS = {0:'Pinned',1:'Session',2:'Semantic',3:'Org'};

    q.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const val = q.value.trim();
        if (val.length >= 2) vscode.postMessage({type:'search', query:val});
        else results.innerHTML = '<div class="empty">Type to search your memories</div>';
      }, 300);
    });

    window.addEventListener('message', e => {
      const msg = e.data;
      if (msg.type === 'results') {
        const mems = msg.data.memories || [];
        if (!mems.length) { results.innerHTML = '<div class="empty">No results</div>'; return; }
        results.innerHTML = '<div class="count">' + msg.data.count + ' results</div>' +
          mems.map(m => {
            const preview = m.content.length > 200 ? m.content.slice(0,200)+'…' : m.content;
            const tier = TIERS[m.tier] || 'T'+m.tier;
            return '<div class="memory"><span class="tier">'+tier+'</span> '+escHtml(preview)+
              '<div class="actions"><button onclick="copy(\''+esc(m.id)+'\')">Copy</button>'+
              '<button onclick="insert(\''+esc(m.id)+'\')">Insert</button></div></div>';
          }).join('');
        window._mems = mems;
      } else if (msg.type === 'error') {
        results.innerHTML = '<div class="empty">Error: '+escHtml(msg.message)+'</div>';
      }
    });

    function copy(id) { const m = window._mems.find(x=>x.id===id); if(m) vscode.postMessage({type:'copy',content:m.content}); }
    function insert(id) { const m = window._mems.find(x=>x.id===id); if(m) vscode.postMessage({type:'insert',content:m.content}); }
    function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function esc(s) { return s.replace(/'/g,"\\'"); }
  </script>
</body>
</html>`;
  }
}
