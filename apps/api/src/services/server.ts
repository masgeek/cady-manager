import { randomUUID } from 'node:crypto';
import type { Server } from '@caddy-manager/shared-types';
import { NotFoundError } from '../lib/errors';

interface ServerRow {
  id: string;
  name: string;
  hostname: string;
  apiEndpoint: string;
  status: string;
  version: string | null;
  createdAt: string;
  updatedAt: string;
}

const servers: Map<string, ServerRow> = new Map();

function toServer(row: ServerRow): Server {
  return {
    id: row.id,
    name: row.name,
    hostname: row.hostname,
    apiEndpoint: row.apiEndpoint,
    status: row.status as Server['status'],
    version: row.version ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listServers(): Promise<Server[]> {
  return Array.from(servers.values()).map(toServer);
}

export async function getServer(id: string): Promise<Server> {
  const row = servers.get(id);
  if (!row) throw new NotFoundError('Server', id);
  return toServer(row);
}

export async function createServer(data: {
  name: string;
  hostname: string;
  apiEndpoint: string;
}): Promise<Server> {
  const now = new Date().toISOString();
  const row: ServerRow = {
    id: randomUUID(),
    name: data.name,
    hostname: data.hostname,
    apiEndpoint: data.apiEndpoint,
    status: 'unknown',
    version: null,
    createdAt: now,
    updatedAt: now,
  };
  servers.set(row.id, row);
  return toServer(row);
}

export async function updateServer(
  id: string,
  data: Partial<{ name: string; hostname: string; apiEndpoint: string }>,
): Promise<Server> {
  const row = servers.get(id);
  if (!row) throw new NotFoundError('Server', id);

  if (data.name !== undefined) row.name = data.name;
  if (data.hostname !== undefined) row.hostname = data.hostname;
  if (data.apiEndpoint !== undefined) row.apiEndpoint = data.apiEndpoint;
  row.updatedAt = new Date().toISOString();

  return toServer(row);
}

export async function deleteServer(id: string): Promise<void> {
  if (!servers.has(id)) throw new NotFoundError('Server', id);
  servers.delete(id);
}

export async function updateServerStatus(
  id: string,
  status: string,
  version?: string,
): Promise<void> {
  const row = servers.get(id);
  if (!row) return;
  row.status = status;
  if (version !== undefined) row.version = version;
  row.updatedAt = new Date().toISOString();
}
