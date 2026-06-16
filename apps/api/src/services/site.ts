import { randomUUID } from 'node:crypto';
import type { Site } from '@caddy-manager/shared-types';
import { NotFoundError } from '../lib/errors';

interface SiteRow {
  id: string;
  serverId: string;
  domain: string;
  upstream: string;
  tlsEnabled: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const sites: Map<string, SiteRow> = new Map();

function toSite(row: SiteRow): Site {
  return {
    id: row.id,
    serverId: row.serverId,
    domain: row.domain,
    upstream: row.upstream,
    tlsEnabled: row.tlsEnabled,
    status: row.status as Site['status'],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listSites(serverId?: string): Promise<Site[]> {
  const all = Array.from(sites.values());
  const filtered = serverId ? all.filter(s => s.serverId === serverId) : all;
  return filtered.map(toSite);
}

export async function getSite(id: string): Promise<Site> {
  const row = sites.get(id);
  if (!row) throw new NotFoundError('Site', id);
  return toSite(row);
}

export async function createSite(data: {
  serverId: string;
  domain: string;
  upstream: string;
  tlsEnabled: boolean;
}): Promise<Site> {
  const now = new Date().toISOString();
  const row: SiteRow = {
    id: randomUUID(),
    serverId: data.serverId,
    domain: data.domain,
    upstream: data.upstream,
    tlsEnabled: data.tlsEnabled,
    status: 'inactive',
    createdAt: now,
    updatedAt: now,
  };
  sites.set(row.id, row);
  return toSite(row);
}

export async function updateSite(
  id: string,
  data: Partial<{ domain: string; upstream: string; tlsEnabled: boolean }>,
): Promise<Site> {
  const row = sites.get(id);
  if (!row) throw new NotFoundError('Site', id);

  if (data.domain !== undefined) row.domain = data.domain;
  if (data.upstream !== undefined) row.upstream = data.upstream;
  if (data.tlsEnabled !== undefined) row.tlsEnabled = data.tlsEnabled;
  row.updatedAt = new Date().toISOString();

  return toSite(row);
}

export async function deleteSite(id: string): Promise<void> {
  if (!sites.has(id)) throw new NotFoundError('Site', id);
  sites.delete(id);
}

export async function getSitesByServer(serverId: string): Promise<Site[]> {
  const rows = Array.from(sites.values()).filter(s => s.serverId === serverId);
  return rows.map(toSite);
}
