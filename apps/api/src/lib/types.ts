import type { ColumnType, Generated } from 'kysely';

export interface ServersTable {
  id: Generated<string>;
  name: string;
  hostname: string;
  api_endpoint: string;
  status: string;
  version: string | null;
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
}

export interface SitesTable {
  id: Generated<string>;
  server_id: string;
  domain: string;
  upstream: string;
  tls_enabled: boolean;
  status: string;
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
}

export interface AuditEventsTable {
  id: Generated<string>;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  details: string | null;
  result: string;
  timestamp: ColumnType<string, string | undefined, never>;
}

export interface UsersTable {
  id: Generated<string>;
  email: string;
  role: string;
  password_hash: string;
  created_at: ColumnType<string, string | undefined, never>;
}

export interface DB {
  servers: ServersTable;
  sites: SitesTable;
  audit_events: AuditEventsTable;
  users: UsersTable;
}
