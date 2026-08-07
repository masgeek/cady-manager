import type { Server, Site } from '@caddy-manager/shared-types';
import { siteRepo, serverRepo } from '@caddy-manager/db';
import { CaddyProvider } from '../providers/caddy';

export interface ParsedSite {
  domain: string;
  upstream?: string;
  routeId?: string;
  caddyServerName: string;
  tlsEnabled: boolean;
  routeConfig: Record<string, unknown>;
}

export interface ImportPreviewSite extends ParsedSite {
  alreadyImported: boolean;
}

function findReverseProxyDial(handles: Array<Record<string, unknown>> | undefined): string | undefined {
  if (!handles) return undefined;
  for (const h of handles) {
    if (h.handler === 'reverse_proxy') {
      const upstreams = h.upstreams as Array<Record<string, unknown>> | undefined;
      const dial = upstreams?.[0]?.dial as string | undefined;
      if (dial) return dial;
    }
    if (h.handler === 'subroute') {
      const subRoutes = h.routes as Array<Record<string, unknown>> | undefined;
      if (subRoutes) {
        for (const sr of subRoutes) {
          const result = findReverseProxyDial(sr.handle as Array<Record<string, unknown>> | undefined);
          if (result) return result;
        }
      }
    }
  }
  return undefined;
}

function collectTlsDomains(tls: Record<string, unknown> | undefined): Set<string> {
  const domains = new Set<string>();
  if (!tls) return domains;

  // automation.policies[].subjects[] (v2.8+ common format)
  const automation = tls.automation as Record<string, unknown> | undefined;
  if (automation) {
    const policies = automation.policies as Array<Record<string, unknown>> | undefined;
    if (policies) {
      for (const p of policies) {
        const subjects = p.subjects as string[] | undefined;
        if (subjects) {
          for (const s of subjects) domains.add(s);
        }
      }
    }
  }

  // certificates.auto[] / certificates.automate[] (legacy format)
  const certs = (tls.certificates ?? tls.cert) as Record<string, unknown> | undefined;
  if (certs) {
    const automated = (certs.automate ?? certs.auto) as string[] | undefined;
    if (automated) {
      for (const d of automated) domains.add(d);
    }
  }

  return domains;
}

export function parseSitesFromConfig(config: Record<string, unknown>): ParsedSite[] {
  const apps = config.apps as Record<string, unknown> | undefined;
  if (!apps) return [];

  const http = apps.http as Record<string, unknown> | undefined;
  if (!http) return [];

  const servers = http.servers as Record<string, unknown> | undefined;
  if (!servers) return [];

  const tlsDomains = collectTlsDomains(apps.tls as Record<string, unknown> | undefined);

  const sites: ParsedSite[] = [];
  const seen = new Set<string>();

  for (const serverName of Object.keys(servers)) {
    const srv = servers[serverName] as Record<string, unknown>;
    const routes = srv.routes as Array<Record<string, unknown>> | undefined;
    if (!routes) continue;

    for (const route of routes) {
      const match = (route.match as Array<Record<string, unknown>> | undefined)?.[0];
      const hosts = match?.host as string[] | undefined;
      if (!hosts || hosts.length === 0) continue;

      const dial = findReverseProxyDial(route.handle as Array<Record<string, unknown>> | undefined);
      const upstreamUrl = dial ? (dial.includes('://') ? dial : `http://${dial}`) : undefined;
      const routeId = route['@id'] as string | undefined;

      for (const domain of hosts) {
        if (seen.has(domain)) continue;
        seen.add(domain);
        sites.push({
          domain,
          upstream: upstreamUrl,
          routeId,
          caddyServerName: serverName,
          tlsEnabled: tlsDomains.has(domain),
          routeConfig: structuredClone(route),
        });
      }
    }
  }

  return sites;
}

export async function importSitesFromConfig(
  server: Server,
  provider: CaddyProvider,
): Promise<{ imported: number; skipped: number; sites: Site[] }> {
  const config = await provider.getConfig();
  console.log('=== Imported Caddy config ===\n' + JSON.stringify(config, null, 2) + '\n=============================');

  const parsed = parseSitesFromConfig(config);

  let imported = 0;
  let skipped = 0;
  const sites: Site[] = [];

  for (const p of parsed) {
    const existing = await siteRepo.findByDomainAndServer(p.domain, server.id);
    if (existing) {
      skipped++;
      const updated = await siteRepo.update(existing.id, { routeConfig: p.routeConfig });
      sites.push(updated ?? existing);
      continue;
    }

    const site = await siteRepo.create({
      serverId: server.id,
      domain: p.domain,
      upstream: p.upstream,
      routeId: p.routeId,
      caddyServerName: p.caddyServerName,
      tlsEnabled: p.tlsEnabled,
      routeConfig: p.routeConfig,
    });
    imported++;
    sites.push(site);
  }

  return { imported, skipped, sites };
}

export async function previewSitesFromConfig(
  server: Server,
  provider: CaddyProvider,
): Promise<ImportPreviewSite[]> {
  const parsed = parseSitesFromConfig(await provider.getConfig());
  return Promise.all(parsed.map(async (site) => ({
    ...site,
    alreadyImported: !!await siteRepo.findByDomainAndServer(site.domain, server.id),
  })));
}

export function buildCaddyConfig(server: Server, sites: Site[]): Record<string, unknown> {
  const serverRoutes = sites.map(site => buildCaddyRoute({
    domain: site.domain,
    upstream: site.upstream,
    routeId: site.routeId || site.domain.replace(/[^a-zA-Z0-9_-]/g, '_'),
    routeConfig: site.routeConfig,
  }));

  const apps: Record<string, unknown> = {
    http: {
      servers: {
        proxy: {
          listen: [':80', ':443'],
          routes: serverRoutes,
        },
      },
    },
  };

  const tlsSites = sites.filter(s => s.tlsEnabled);
  if (tlsSites.length > 0) {
    apps.tls = {
      certificates: {
        auto: tlsSites.map(s => s.domain),
      },
    };
  }

  return { apps };
}

export function buildCaddyRoute(site: {
  domain: string;
  upstream?: string;
  routeId?: string;
  routeConfig?: Record<string, unknown>;
}): Record<string, unknown> {
  if (site.routeConfig) {
    const route = structuredClone(site.routeConfig);
    const matches = route.match as Array<Record<string, unknown>> | undefined;
    if (matches?.length) {
      route.match = matches.map((match, index) => index === 0 ? {...match, host: [site.domain]} : match);
    }
    if (site.routeId) route['@id'] = site.routeId;
    return route;
  }

  if (!site.upstream) {
    throw new Error('An upstream URL is required when no custom route configuration is provided');
  }

  return {
    '@id': site.routeId || site.domain.replace(/[^a-zA-Z0-9_-]/g, '_'),
    match: [{ host: [site.domain] }],
    handle: [
      {
        handler: 'reverse_proxy',
        upstreams: [{ dial: site.upstream.replace(/^https?:\/\//, '') }],
      },
    ],
  };
}

export function parseServerBlocksFromConfig(config: Record<string, unknown>): Array<{
  name: string;
  domains: string[];
}> {
  const apps = config.apps as Record<string, unknown> | undefined;
  if (!apps) return [];

  const http = apps.http as Record<string, unknown> | undefined;
  if (!http) return [];

  const servers = http.servers as Record<string, unknown> | undefined;
  if (!servers) return [];

  const blocks: Array<{ name: string; domains: string[] }> = [];
  const seen = new Set<string>();

  for (const serverName of Object.keys(servers)) {
    const srv = servers[serverName] as Record<string, unknown>;
    const routes = srv.routes as Array<Record<string, unknown>> | undefined;
    if (!routes) continue;

    const domains: string[] = [];
    for (const route of routes) {
      const match = (route.match as Array<Record<string, unknown>> | undefined)?.[0];
      const hosts = match?.host as string[] | undefined;
      if (!hosts) continue;
      for (const h of hosts) {
        if (!seen.has(h)) {
          seen.add(h);
          domains.push(h);
        }
      }
    }
    if (domains.length > 0) {
      blocks.push({ name: serverName, domains });
    }
  }

  return blocks;
}

function hostnameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return url;
  }
}

const MULTI_LABEL_PUBLIC_SUFFIXES = new Set([
  'ac.ke', 'ci.ke', 'co.ke', 'go.ke', 'me.ke', 'ne.ke', 'or.ke', 'sc.ke',
  'co.uk', 'org.uk', 'com.au', 'co.nz', 'co.za', 'com.br', 'com.cn',
]);

export function deriveBaseDomain(domain: string): string {
  const hostname = domain.trim().toLowerCase().replace(/^\*\./, '');
  const labels = hostname.split('.').filter(Boolean);
  if (labels.length <= 2) return labels.join('.') || 'unknown';

  const suffix = labels.slice(-2).join('.');
  return labels.slice(-(MULTI_LABEL_PUBLIC_SUFFIXES.has(suffix) ? 3 : 2)).join('.');
}

export async function discoverAndImport(
  apiEndpoint: string,
): Promise<{ servers: Server[]; imported: number; skipped: number; sites: Site[] }> {
  const provider = new CaddyProvider({ apiEndpoint });
  const config = await provider.getConfig();
  const parsed = parseSitesFromConfig(config);
  if (parsed.length === 0) throw new Error('No sites found in Caddy config');

  const hostname = hostnameFromUrl(apiEndpoint);

  const allServers = await serverRepo.findAll();
  const servers = new Map<string, Server>();
  const getServer = async (name: string): Promise<Server> => {
    const existing = servers.get(name);
    if (existing) return existing;

    const found = allServers.find((s) => s.apiEndpoint === apiEndpoint && s.name === name);
    const server = found
      ? (found.hostname === name
        ? found
        : await serverRepo.update(found.id, {hostname: name}) ?? found)
      : await serverRepo.create({name, hostname: name, apiEndpoint});
    servers.set(name, server);
    return server;
  };

  let imported = 0;
  let skipped = 0;
  const sites: Site[] = [];

  for (const p of parsed) {
    const server = await getServer(deriveBaseDomain(p.domain));
    const existing = await siteRepo.findByDomainAndServer(p.domain, server.id);
    if (existing) {
      skipped++;
      const updated = await siteRepo.update(existing.id, { routeConfig: p.routeConfig });
      sites.push(updated ?? existing);
      continue;
    }
    const site = await siteRepo.create({
      serverId: server.id,
      domain: p.domain,
      upstream: p.upstream,
      routeId: p.routeId,
      caddyServerName: p.caddyServerName,
      tlsEnabled: p.tlsEnabled,
      routeConfig: p.routeConfig,
    });
    imported++;
    sites.push(site);
  }

  return { servers: [...servers.values()], imported, skipped, sites };
}

export async function getServerConfig(provider: CaddyProvider): Promise<Record<string, unknown>> {
  return provider.getConfig();
}

export async function reloadServerConfig(
  provider: CaddyProvider,
  server: Server,
  sites: Site[],
): Promise<void> {
  const config = buildCaddyConfig(server, sites);
  await provider.reloadConfig(config);
}
