# Velixar AI Memory — VS Code Extension

Persistent memory for any AI assistant, right in your IDE.

## Features

- **Memory Browser** — Browse all memories grouped by tier (Pinned, Session, Semantic, Org)
- **Semantic Search** — Real-time search with live results in the sidebar
- **Store from Editor** — Select text → right-click → "Store as Memory"
- **Quick Actions** — Copy, insert at cursor, or open any memory
- **Service Health** — Live status of API, Qdrant, and Redis
- **Secure** — API key stored in VS Code's encrypted secret storage

## Setup

1. Install the extension
2. Open the Velixar sidebar (brain icon in activity bar)
3. Click "API Key: Not set" or run `Velixar: Set API Key`
4. Enter your API key (`vlx_...`) from [velixarai.com](https://velixarai.com)

## Commands

| Command | Description |
|---------|-------------|
| `Velixar: Set API Key` | Configure your API key |
| `Velixar: Search Memories` | Quick pick search with actions |
| `Velixar: Store Selection as Memory` | Save selected text as a memory |
| `Velixar: Refresh Memories` | Reload the memory browser |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `velixar.apiUrl` | Production API | Velixar API endpoint |
| `velixar.defaultTier` | 2 (Semantic) | Default tier for new memories |

## Compatibility

Works in VS Code, Cursor, Windsurf, Kiro IDE, and any VS Code-based editor.

## Links

- [Documentation](https://velixarai.com/docs)
- [API Keys](https://velixarai.com/api-keys)
- [GitHub](https://github.com/VelixarAi/velixar-vscode)
