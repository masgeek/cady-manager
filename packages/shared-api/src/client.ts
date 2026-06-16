import type {
  Server,
  Site,
  HealthResponse,
  AuditEvent,
} from '@caddy-manager/shared-types';
import type {
  PaginatedResponse,
  CreateServerRequest,
  UpdateServerRequest,
  CreateSiteRequest,
  UpdateSiteRequest,
} from './types.js';

export class ApiClient {
  private baseUrl: string;
  private credentials: string;

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.credentials = btoa(`${username}:${password}`);
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Basic ${this.credentials}`,
    };
  }

  async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...this.headers, ...options?.headers },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  // Servers
  async getServers(): Promise<Server[]> {
    return this.request('/servers');
  }

  async getServer(id: string): Promise<Server> {
    return this.request(`/servers/${id}`);
  }

  async createServer(data: CreateServerRequest): Promise<Server> {
    return this.request('/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateServer(id: string, data: UpdateServerRequest): Promise<Server> {
    return this.request(`/servers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteServer(id: string): Promise<void> {
    return this.request(`/servers/${id}`, { method: 'DELETE' });
  }

  // Sites
  async getSites(): Promise<Site[]> {
    return this.request('/sites');
  }

  async getSite(id: string): Promise<Site> {
    return this.request(`/sites/${id}`);
  }

  async createSite(data: CreateSiteRequest): Promise<Site> {
    return this.request('/sites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSite(id: string, data: UpdateSiteRequest): Promise<Site> {
    return this.request(`/sites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSite(id: string): Promise<void> {
    return this.request(`/sites/${id}`, { method: 'DELETE' });
  }

  // Config
  async getConfig(): Promise<Record<string, unknown>> {
    return this.request('/config');
  }

  async reloadConfig(): Promise<void> {
    return this.request('/config/reload', { method: 'POST' });
  }

  // Health
  async getHealth(): Promise<HealthResponse> {
    return this.request('/health');
  }

  // Logs
  async getLogs(params?: {
    limit?: number;
    search?: string;
  }): Promise<string[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return this.request(`/logs${qs ? `?${qs}` : ''}`);
  }

  // Audit
  async getAuditLogs(params?: {
    limit?: number;
  }): Promise<AuditEvent[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.request(`/audit${qs ? `?${qs}` : ''}`);
  }
}
