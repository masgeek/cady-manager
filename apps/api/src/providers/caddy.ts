export interface ProviderConfig {
  apiEndpoint: string;
  timeout?: number;
}

export class CaddyProvider {
  private apiEndpoint: string;
  private timeout: number;

  constructor(config: ProviderConfig) {
    this.apiEndpoint = config.apiEndpoint.replace(/\/+$/, '');
    this.timeout = config.timeout ?? 5000;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.apiEndpoint}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`Caddy API error: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      return (text ? JSON.parse(text) : null) as T;
    } finally {
      clearTimeout(id);
    }
  }

  async getConfig(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/config/');
  }

  async reloadConfig(config: Record<string, unknown>): Promise<void> {
    await this.request('/load', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async health(): Promise<{ status: string }> {
    return this.request('/health');
  }

  async getLogs(): Promise<string[]> {
    try {
      const response = await this.request<string[]>('/logs/request.json');
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }
}
