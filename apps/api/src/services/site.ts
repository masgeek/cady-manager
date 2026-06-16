import type { Site } from '@caddy-manager/shared-types';
import { db } from '../lib/db';
import { NotFoundError } from '../lib/errors';

function toSite(row: {
  id: string;
  server_id: string;
  domain: string;
  upstream: string;
  tls_enabled: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}): Site {
  return {
    id: row.id,
    serverId: row.server_id,
    domain: row.domain,
    upstream: row.upstream,
    tlsEnabled: row.tls_enabled,
    status: row.status as Site['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSites(serverId?: string): Promise<Site[]> {
  let query = db.selectFrom('sites').selectAll();
  if (serverId) query = query.where('server_id', '=', serverId);
  const rows = await query.execute();
  return rows.map(toSite);
}

export async function getSite(id: string): Promise<Site> {
  const row = await db.selectFrom('sites').selectAll().where('id', '=', id).executeTakeFirst();
  if (!row) throw new NotFoundError('Site', id);
  return toSite(row);
}

export async function createSite(data: {
  serverId: string;
  domain: string;
  upstream: string;
  tlsEnabled: boolean;
}): Promise<Site> {
  const row = await db
    .insertInto('sites')
    .values({
      server_id: data.serverId,
      domain: data.domain,
      upstream: data.upstream,
      tls_enabled: data.tlsEnabled,
      status: 'inactive',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  return toSite(row);
}

export async function updateSite(
  id: string,
  data: Partial<{ domain: string; upstream: string; tlsEnabled: boolean }>,
): Promise<Site> {
  const update: Record<string, unknown> = {};
  if (data.domain !== undefined) update.domain = data.domain;
  if (data.upstream !== undefined) update.upstream = data.upstream;
  if (data.tlsEnabled !== undefined) update.tls_enabled = data.tlsEnabled;

  const row = await db
    .updateTable('sites')
    .set({ ...update, updated_at: new Date().toISOString() })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();
  if (!row) throw new NotFoundError('Site', id);
  return toSite(row);
}

export async function deleteSite(id: string): Promise<void> {
  const result = await db.deleteFrom('sites').where('id', '=', id).executeTakeFirst();
  if (result.numDeletedRows === BigInt(0)) throw new NotFoundError('Site', id);
}

export async function getSitesByServer(serverId: string): Promise<Site[]> {
  const rows = await db
    .selectFrom('sites')
    .selectAll()
    .where('server_id', '=', serverId)
    .execute();
  return rows.map(toSite);
}
