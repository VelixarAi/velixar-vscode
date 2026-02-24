# Changelog

## 0.2.1 — 2026-02-24

### Fixed
- Default API URL now points to `api.velixarai.com` instead of raw gateway URL
- Removed internal infrastructure names from tier descriptions

## 0.2.0 — 2026-02-22

### Added
- **Commit to Team Memory** — right-click selected code to commit to your org's team memory
- **Search Org Memories** — semantic search across team and organization knowledge via command palette
- Machine Learning category for marketplace visibility

### Improved
- Added org-memory and agent keywords for discoverability

## 0.1.0 — 2026-02-15

### Added
- Sidebar memory browser grouped by tier (Pinned, Session, Semantic, Organization)
- Real-time semantic search webview with copy and insert actions
- Store selected text as memory via right-click context menu
- Quick pick search command with copy, insert, and open-in-editor actions
- Service health panel showing API, Qdrant, and Redis status
- API key stored securely in VS Code's encrypted secret storage
- Auto-refresh every 60 seconds
- Configurable API URL and default memory tier
