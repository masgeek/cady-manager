import type { Site } from "@caddy-manager/shared-types";
import { siteRepo, serverRepo } from "@caddy-manager/db";
import { CaddyProvider } from "../providers/caddy";
import { buildCaddyRoute, syncDynamicRoutes } from "./config";
import { NotFoundError } from "../lib/errors";
import { disableInventoryForSite } from "./inventory";

export async function listSites(serverId?: string): Promise<Site[]> {
  return siteRepo.findAll(serverId);
}

export async function getSite(id: string): Promise<Site> {
  const site = await siteRepo.findById(id);
  if (!site) throw new NotFoundError("Site", id);
  return site;
}

export async function updateSite(
  id: string,
  data: Partial<{
    serverId: string;
    domain: string;
    upstream?: string;
    routeId?: string;
    caddyServerName?: string;
    routeConfig?: Record<string, unknown>;
    tlsEnabled: boolean;
    healthEndpoint?: string;
    healthHeaders?: string;
  }>,
): Promise<Site> {
  const existing = await siteRepo.findById(id);
  if (!existing) throw new NotFoundError("Site", id);
  if (!existing.routeId && data.routeId !== undefined) {
    throw new Error(
      `Caddyfile-managed site '${existing.domain}' cannot be assigned a dynamic route ID`,
    );
  }

  const merged = { ...existing, ...data };

  if (existing.routeId) {
    const oldServer = await serverRepo.findById(existing.serverId);
    const newServer = await serverRepo.findById(merged.serverId);
    if (!oldServer || !newServer)
      throw new NotFoundError("Server", merged.serverId);

    const oldRouteId = existing.routeId;
    const newRouteId = data.routeId ?? oldRouteId;
    const route = buildCaddyRoute({ ...merged, routeId: newRouteId });
    const serverBlockChanged =
      existing.serverId !== merged.serverId ||
      (data.caddyServerName !== undefined &&
        data.caddyServerName !== existing.caddyServerName);
    const routeIdChanged = newRouteId !== oldRouteId;

    const oldProvider = new CaddyProvider({
      apiEndpoint: oldServer.apiEndpoint,
    });
    const newProvider = new CaddyProvider({
      apiEndpoint: newServer.apiEndpoint,
    });

    if (serverBlockChanged || routeIdChanged) {
      const oldSites = (await siteRepo.findByServer(existing.serverId)).filter(
        (site) => site.id !== existing.id,
      );
      const oldServerName =
        existing.caddyServerName ?? (await oldProvider.getServerNames())[0];
      if (!oldServerName)
        throw new Error(`No Caddy server block found for site ${existing.id}`);
      await syncDynamicRoutes(oldProvider, oldServerName, oldSites);
      const serverNames = await newProvider.getServerNames();
      const serverName = merged.caddyServerName ?? serverNames[0];
      if (!serverName || !serverNames.includes(serverName)) {
        throw new Error(
          `Caddy server block not found: ${serverName ?? "(none)"}`,
        );
      }
      const newSites = (await siteRepo.findByServer(merged.serverId)).filter(
        (site) => !site.caddyServerName || site.caddyServerName === serverName,
      );
      await syncDynamicRoutes(newProvider, serverName, [
        ...newSites,
        merged as Site,
      ]);
    } else {
      const serverName =
        existing.caddyServerName ?? (await oldProvider.getServerNames())[0];
      if (!serverName)
        throw new Error(`No Caddy server block found for site ${existing.id}`);
      const sites = (await siteRepo.findByServer(existing.serverId))
        .filter(
          (site) =>
            !site.caddyServerName || site.caddyServerName === serverName,
        )
        .map((site) => (site.id === existing.id ? (merged as Site) : site));
      await syncDynamicRoutes(oldProvider, serverName, sites);
    }

    data = { ...data, routeId: newRouteId, routeConfig: route };
  }

  const site = await siteRepo.update(id, data);
  if (!site) throw new NotFoundError("Site", id);

  if (!site.synced) {
    await siteRepo.updateSyncedStatus(site.id, true);
    site.synced = true;
  }

  return site;
}

export async function deleteSite(id: string): Promise<void> {
  const site = await siteRepo.findById(id);
  if (!site) throw new NotFoundError("Site", id);

  await disableInventoryForSite(site.serverId, site.domain);
  await siteRepo.delete(id);
}

export async function syncSite(id: string): Promise<Site> {
  const site = await siteRepo.findById(id);
  if (!site) throw new NotFoundError("Site", id);

  const server = await serverRepo.findById(site.serverId);
  if (!server) throw new NotFoundError("Server", site.serverId);

  if (!site.routeId) {
    await siteRepo.updateSyncedStatus(id, true);
    return { ...site, synced: true };
  }

  const provider = new CaddyProvider({ apiEndpoint: server.apiEndpoint });
  const servers = await provider.getServerNames();
  const serverName = site.caddyServerName ?? servers[0];
  if (!serverName) throw new Error("No Caddy servers found");
  if (!servers.includes(serverName))
    throw new Error(`Caddy server block not found: ${serverName}`);

  const sites = await siteRepo.findByServer(site.serverId);
  await syncDynamicRoutes(provider, serverName, sites);
  await siteRepo.updateSyncedStatus(id, true);

  return { ...site, synced: true };
}

export async function getSitesByServer(serverId: string): Promise<Site[]> {
  return siteRepo.findByServer(serverId);
}
