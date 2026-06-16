import type { Server } from '@caddy-manager/shared-types';
import { db } from '../lib/db';
import { NotFoundError } from '../lib/errors';

function toServer(row: {
  id: string;
  name: string;
  hostname: string;
  api_endpoint: string;
  status: string;
  version: string | null;
  created_at: string;
  updated_at: string;
}): Server {
  return {
    id: row.id,
    name: row.name,
    hostname: row.hostname,
    apiEndpoint: row.api_endpoint,
    status: row.status as Server['status'],
    version: row.version ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listServers(): Promise<Server[]> {
  const rows = await db.selectFrom('servers').selectAll().execute();
  return rows.map(toServer);
}

export async function getServer(id: string): Promise<Server> {
  const row = await db.selectFrom('servers').selectAll().where('id', '=', id).executeTakeFirst();
  if (!row) throw new NotFoundError('Server', id);
  return toServer(row);
}

export async function createServer(data: {
  name: string;
  hostname: string;
  apiEndpoint: string;
}): Promise<Server> {
  const row = await db
    .insertInto('servers')
    .values({
      name: data.name,
      hostname: data.hostname,
      api_endpoint: data.apiEndpoint,
      status: 'unknown',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  return toServer(row);
}

export async function updateServer(
  id: string,
  data: Partial<{ name: string; hostname: string; apiEndpoint: string }>,
): Promise<Server> {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.hostname !== undefined) update.hostname = data.hostname;
  if (data.apiEndpoint !== undefined) update.api_endpoint = data.apiEndpoint;

  const row = await db
    .updateTable('servers')
    .set({ ...update, updated_at: new Date().toISOString() })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();
  if (!row) throw new NotFoundError('Server', id);
  return toServer(row);
}

export async function deleteServer(id: string): Promise<void> {
  const result = await db.deleteFrom('servers').where('id', '=', id).executeTakeFirst();
  if (result.numDeletedRows === BigInt(0)) throw new NotFoundError('Server', id);
}

export async function updateServerStatus(
  id: string,
  status: string,
  version?: string,
): Promise<void> {
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (version !== undefined) update.version = version;
  await db.updateTable('servers').set(update).where('id', '=', id).execute();
}
