export interface Server {
  id: string;
  name: string;
  hostname: string;
  apiEndpoint: string;
  status: ServerStatus;
  version?: string;
  createdAt: string;
  updatedAt: string;
}

export type ServerStatus = 'online' | 'offline' | 'degraded' | 'unknown';

export interface Site {
  id: string;
  serverId: string;
  domain: string;
  upstream: string;
  tlsEnabled: boolean;
  status: SiteStatus;
  createdAt: string;
  updatedAt: string;
}

export type SiteStatus = 'active' | 'inactive' | 'error';

export interface Route {
  id: string;
  host: string;
  path: string;
  upstream: string;
}

export interface HealthResponse {
  status: ServerStatus;
  version?: string;
  uptime?: number;
  checkedAt: string;
}

export interface AuditEvent {
  id: string;
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  details?: string;
  timestamp: string;
  result: 'success' | 'failure';
}

export type AuditAction = 'create' | 'update' | 'delete' | 'reload' | 'login' | 'logout';

export type AuditEntity = 'site' | 'server' | 'config' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface ConfigurationSnapshot {
  id: string;
  serverId: string;
  configuration: string;
  timestamp: string;
}
