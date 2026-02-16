import * as vscode from "vscode";

const API_KEY_SECRET = "velixar.apiKey";

export class ApiClient {
  private secrets: vscode.SecretStorage;

  constructor(secrets: vscode.SecretStorage) {
    this.secrets = secrets;
  }

  private get baseUrl(): string {
    return vscode.workspace
      .getConfiguration("velixar")
      .get("apiUrl", "https://t4xrnwgo7f.execute-api.us-east-1.amazonaws.com/v1");
  }

  async getApiKey(): Promise<string | undefined> {
    return this.secrets.get(API_KEY_SECRET);
  }

  async setApiKey(key: string): Promise<void> {
    await this.secrets.store(API_KEY_SECRET, key);
  }

  async clearApiKey(): Promise<void> {
    await this.secrets.delete(API_KEY_SECRET);
  }

  private async fetch(path: string, options: RequestInit = {}): Promise<any> {
    const key = await this.getApiKey();
    if (!key) {
      throw new Error("API key not set. Run 'Velixar: Set API Key' first.");
    }

    const url = `${this.baseUrl}${path}`;
    const resp = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
      },
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`API ${resp.status}: ${body}`);
    }

    return resp.json();
  }

  async storeMemory(content: string, tier?: number, tags?: string[]): Promise<{ id: string }> {
    return this.fetch("/memory", {
      method: "POST",
      body: JSON.stringify({ content, tier, tags }),
    });
  }

  async searchMemories(query: string, limit = 10): Promise<{ memories: Memory[]; count: number }> {
    return this.fetch(`/memory/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async listMemories(limit = 50): Promise<{ memories: Memory[]; count: number }> {
    return this.fetch(`/memory/list?limit=${limit}`);
  }

  async getMemory(id: string): Promise<Memory> {
    return this.fetch(`/memory/${id}`);
  }

  async deleteMemory(id: string): Promise<void> {
    return this.fetch(`/memory/${id}`, { method: "DELETE" });
  }

  async updateMemory(id: string, content: string): Promise<void> {
    return this.fetch(`/memory/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
  }

  async getHealth(): Promise<{ status: string; qdrant: boolean; redis: boolean }> {
    const resp = await fetch(`${this.baseUrl}/health`);
    return resp.json() as Promise<{ status: string; qdrant: boolean; redis: boolean }>;
  }
}

export interface Memory {
  id: string;
  content: string;
  tier?: number;
  tags?: string[];
  created_at?: string;
  score?: number;
}
