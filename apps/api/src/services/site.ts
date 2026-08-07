import type { Site } from '@caddy-manager/shared-types';
import { siteRepo, serverRepo } from '@caddy-manager/db';
import { CaddyProvider } from '../providers/caddy';
import { buildCaddyRoute } from './config';
import { ConflictError, NotFoundError } from '../lib/errors';

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
  upstream?: string;
  routeId?: string;
  caddyServerName?: string;
  routeConfig?: Record<string, unknown>;
  tlsEnabled: boolean;
  healthEndpoint?: string;
  healthHeaders?: string;
}): Promise<Site> {
  const server = await serverRepo.findById(data.serverId);
  if (!server) throw new NotFoundError('Server', data.serverId);

  const existing = await siteRepo.findByDomainAndServer(data.domain, data.serverId);
  if (existing) throw new ConflictError(`Site '${data.domain}' already exists on this server`);

  const provider = new CaddyProvider({ apiEndpoint: server.apiEndpoint });
  const servers = await provider.getServerNames();
  const serverName = data.caddyServerName ?? servers[0];

  if (serverName && !servers.includes(serverName)) {
    throw new Error(`Caddy server block not found: ${serverName}`);
  }

  if (serverName) {
    const route = buildCaddyRoute(data);
    const routeId = data.routeId ?? route['@id'] as string | undefined;
    await provider.addRoute(serverName, route);
    data = {...data, routeId};
  }

  return siteRepo.create(data);
}

export async function updateSite(
  id: string,
  data: Partial<{ serverId: string; domain: string; upstream?: string; routeId?: string; caddyServerName?: string; routeConfig?: Record<string, unknown>; tlsEnabled: boolean; healthEndpoint?: string; healthHeaders?: string }>,
): Promise<Site> {
  const existing = await siteRepo.findById(id);
  if (!existing) throw new NotFoundError('Site', id);

  const merged = { ...existing, ...data };

  if (existing.routeId) {
    const oldServer = await serverRepo.findById(existing.serverId);
    const newServer = await serverRepo.findById(merged.serverId);
    if (!oldServer || !newServer) throw new NotFoundError('Server', merged.serverId);

    const oldRouteId = existing.routeId;
    const newRouteId = data.routeId ?? oldRouteId;
    const route = buildCaddyRoute({...merged, routeId: newRouteId});
    const serverBlockChanged = existing.serverId !== merged.serverId
      || (data.caddyServerName !== undefined && data.caddyServerName !== existing.caddyServerName);
    const routeIdChanged = newRouteId !== oldRouteId;

    const oldProvider = new CaddyProvider({ apiEndpoint: oldServer.apiEndpoint });
    const newProvider = new CaddyProvider({ apiEndpoint: newServer.apiEndpoint });

    if (serverBlockChanged || routeIdChanged) {
      await oldProvider.deleteRouteByID(oldRouteId);
      const serverNames = await newProvider.getServerNames();
      const serverName = merged.caddyServerName ?? serverNames[0];
      if (!serverName || !serverNames.includes(serverName)) {
        throw new Error(`Caddy server block not found: ${serverName ?? '(none)'}`);
      }
      await newProvider.addRoute(serverName, route);
    } else {
      const patch = structuredClone(route);
      delete patch['@id'];
      await oldProvider.updateRouteByID(oldRouteId, patch);
    }

    data = {...data, routeId: newRouteId, routeConfig: route};
  }

  const site = await siteRepo.update(id, data);
  if (!site) throw new NotFoundError('Site', id);

  if (!site.synced) {
    await siteRepo.updateSyncedStatus(site.id, true);
    site.synced = true;
  }

  return site;
}

export async function deleteSite(id: string): Promise<void> {
  const site = await siteRepo.findById(id);
  if (!site) throw new NotFoundError('Site', id);

  if (site.routeId) {
    const server = await serverRepo.findById(site.serverId);
    if (server) {
      const provider = new CaddyProvider({ apiEndpoint: server.apiEndpoint });
      await provider.deleteRouteByID(site.routeId).catch(() => {
        // ignore if route already removed
      });
    }
  }

  await siteRepo.delete(id);
}

export async function syncSite(id: string): Promise<Site> {
  const site = await siteRepo.findById(id);
  if (!site) throw new NotFoundError('Site', id);

  const server = await serverRepo.findById(site.serverId);
  if (!server) throw new NotFoundError('Server', site.serverId);

  const provider = new CaddyProvider({ apiEndpoint: server.apiEndpoint });
  const servers = await provider.getServerNames();
  const serverName = site.caddyServerName ?? servers[0];
  if (!serverName) throw new Error('No Caddy servers found');
  if (!servers.includes(serverName)) throw new Error(`Caddy server block not found: ${serverName}`);

  const routeId = site.routeId || site.domain.replace(/[^a-zA-Z0-9_-]/g, '_');
  const route = buildCaddyRoute({ ...site, routeId });
  await provider.addRoute(serverName, route);

  if (!site.routeId) {
    await siteRepo.update(id, { routeId });
  }
  await siteRepo.updateSyncedStatus(id, true);

  return { ...site, routeId, synced: true };
}

export async function getSitesByServer(serverId: string): Promise<Site[]> {
  return siteRepo.findByServer(serverId);
}
