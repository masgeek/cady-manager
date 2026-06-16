import {config} from '@caddy-manager/config';

export interface ProviderConfig {
    apiEndpoint: string;
    timeout?: number;
}

export class CaddyProvider {
    private apiEndpoint: string;
    private timeout: number;
    private token: string;

    constructor(configOverride: ProviderConfig) {
        this.apiEndpoint = configOverride.apiEndpoint.replace(/\/+$/, '');
        this.timeout = configOverride.timeout ?? 5000;
        this.token = config.caddyAdminToken;
    }

  private getHeaders(options?: RequestInit): Record<string, string> {
    const h: Record<string, string> = {
      Origin: `http://localhost:2019`,
    };
    const method = options?.method ?? 'GET';
    if (method !== 'GET' && method !== 'HEAD') {
      h['Content-Type'] = 'application/json';
    }
    if (this.token) {
      h.Authorization = `Bearer ${this.token}`;
    }
    return h;
  }

    private async request<T>(path: string, options?: RequestInit): Promise<T> {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.apiEndpoint}${path}`, {
                ...options,
                signal: controller.signal,
                redirect: 'follow',
                headers: {
                    ...this.getHeaders(options),
                    ...options?.headers,
                },
            });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Caddy API error: ${response.status} ${response.statusText}${body ? ` — ${body}` : ''}`);
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

    async reloadConfig(configData: Record<string, unknown>): Promise<void> {
        await this.request('/load', {
            method: 'POST',
            body: JSON.stringify(configData),
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
