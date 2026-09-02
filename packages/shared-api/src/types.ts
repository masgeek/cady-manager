import type {
  Server,
  Site,
  HealthResponse,
  AuditEvent,
  ConfigurationSnapshot,
} from "@caddy-manager/shared-types";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  details?: unknown;
}

// Request DTOs
export interface CreateServerRequest {
  name: string;
  hostname: string;
  apiEndpoint: string;
}

export interface UpdateServerRequest {
  name?: string;
  hostname?: string;
  apiEndpoint?: string;
}

export interface CreateSiteRequest {
  serverId: string;
  domain: string;
  upstream?: string;
  routeId?: string;
  caddyServerName?: string;
  routeConfig?: Record<string, unknown>;
  tlsEnabled: boolean;
  healthEndpoint?: string;
  healthHeaders?: string;
}

export interface UpdateSiteRequest {
  domain?: string;
  upstream?: string;
  routeId?: string;
  caddyServerName?: string;
  routeConfig?: Record<string, unknown>;
  tlsEnabled?: boolean;
  healthEndpoint?: string;
  healthHeaders?: string;
}

export interface ImportPreviewSite {
  domain: string;
  upstream?: string;
  routeId?: string;
  caddyServerName: string;
  tlsEnabled: boolean;
  alreadyImported: boolean;
}
