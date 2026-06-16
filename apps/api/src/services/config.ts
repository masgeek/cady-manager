import type { Server, Site } from '@caddy-manager/shared-types';
import { CaddyProvider } from '../providers/caddy';

export function buildCaddyConfig(server: Server, sites: Site[]): Record<string, unknown> {
  const serverRoutes = sites.map(site => ({
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
