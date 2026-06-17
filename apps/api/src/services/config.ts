import type { Server, Site } from '@caddy-manager/shared-types';
import { siteRepo, serverRepo } from '@caddy-manager/db';
import { CaddyProvider } from '../providers/caddy';

interface ParsedSite {
  domain: string;
  upstream: string;
  routeId?: string;
  tlsEnabled: boolean;
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
      if (!dial) continue;

      const upstreamUrl = dial.includes('://') ? dial : `http://${dial}`;
      const routeId = route['@id'] as string | undefined;

      for (const domain of hosts) {
        if (seen.has(domain)) continue;
        seen.add(domain);
        sites.push({
          domain,
          upstream: upstreamUrl,
          routeId,
          tlsEnabled: tlsDomains.has(domain),
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
      sites.push(existing);
      continue;
    }

    const site = await siteRepo.create({
      serverId: server.id,
      domain: p.domain,
      upstream: p.upstream,
      routeId: p.routeId,
      tlsEnabled: p.tlsEnabled,
    });
    imported++;
    sites.push(site);
  }

  return { imported, skipped, sites };
}

export function buildCaddyConfig(server: Server, sites: Site[]): Record<string, unknown> {
  const serverRoutes = sites.map(site => ({
    '@id': site.routeId || site.domain.replace(/[^a-zA-Z0-9_-]/g, '_'),
    match: [{ host: [site.domain] }],
    handle: [
      {
        handler: 'reverse_proxy',
        upstreams: [{ dial: site.upstream.replace(/^https?:\/\//, '') }],
      },
    ],
    terminal: true,
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
  upstream: string;
  routeId?: string;
}): Record<string, unknown> {
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

function pickApexDomain(domains: string[]): string {
  return domains.reduce((apex, d) => (d.split('.').length < apex.split('.').length ? d : apex));
}

export async function discoverAndImport(
  apiEndpoint: string,
): Promise<{ server: Server; imported: number; skipped: number; sites: Site[] }> {
  const provider = new CaddyProvider({ apiEndpoint });
  const config = await provider.getConfig();
  const blocks = parseServerBlocksFromConfig(config);

  if (blocks.length === 0) {
    throw new Error('No server blocks with routes found in Caddy config');
  }

  // use the first server block to create a server entry;
  // pick the apex domain (fewest parts) as the server hostname
  const block = blocks[0];
  const hostname = pickApexDomain(block.domains);

  // check if a server with this apiEndpoint already exists
  const allServers = await serverRepo.findAll();
  let server = allServers.find((s) => s.apiEndpoint === apiEndpoint);

  if (!server) {
    server = await serverRepo.create({
      name: block.name,
      hostname,
      apiEndpoint,
    });
  }

  // import sites for this server
  const parsed = parseSitesFromConfig(config);
  let imported = 0;
  let skipped = 0;
  const sites: Site[] = [];

  for (const p of parsed) {
    const existing = await siteRepo.findByDomainAndServer(p.domain, server.id);
    if (existing) {
      skipped++;
      sites.push(existing);
      continue;
    }
    const site = await siteRepo.create({
      serverId: server.id,
      domain: p.domain,
      upstream: p.upstream,
      routeId: p.routeId,
      tlsEnabled: p.tlsEnabled,
    });
    imported++;
    sites.push(site);
  }

  return { server, imported, skipped, sites };
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
