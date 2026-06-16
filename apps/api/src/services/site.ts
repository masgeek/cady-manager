import type { Site } from '@caddy-manager/shared-types';
import { siteRepo } from '@caddy-manager/db';
import { NotFoundError } from '../lib/errors';

export async function listSites(serverId?: string): Promise<Site[]> {
  return siteRepo.findAll(serverId);
}

export async function getSite(id: string): Promise<Site> {
  const site = await siteRepo.findById(id);
  if (!site) throw new NotFoundError('Site', id);
  return site;
}

export async function createSite(data: {
  serverId: string;
  domain: string;
  upstream: string;
  tlsEnabled: boolean;
}): Promise<Site> {
  return siteRepo.create(data);
}

export async function updateSite(
  id: string,
  data: Partial<{ domain: string; upstream: string; tlsEnabled: boolean }>,
): Promise<Site> {
  const site = await siteRepo.update(id, data);
  if (!site) throw new NotFoundError('Site', id);
  return site;
}

export async function deleteSite(id: string): Promise<void> {
  const deleted = await siteRepo.delete(id);
  if (!deleted) throw new NotFoundError('Site', id);
}

export async function getSitesByServer(serverId: string): Promise<Site[]> {
  return siteRepo.findByServer(serverId);
}
