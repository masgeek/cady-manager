import {describe, expect, it, vi} from 'vitest';

vi.mock('@caddy-manager/db', () => ({
  serverRepo: {},
  siteRepo: {},
}));

import {buildCaddyConfig, buildCaddyRoute, deriveBaseDomain, parseSitesFromConfig} from './config';

describe('site config preservation', () => {
  it.each([
    ['dashboard.agwise.org', 'agwise.org'],
    ['api.munywele.ci.ke', 'munywele.ci.ke'],
    ['example.com', 'example.com'],
  ])('derives %s as %s', (domain, expected) => {
    expect(deriveBaseDomain(domain)).toBe(expected);
  });

  it('keeps the complete route, including path matchers and handlers', () => {
    const route = {
      '@id': 'api-route',
      match: [{host: ['example.com'], path: ['/api/*']}],
      handle: [
        {handler: 'rewrite', uri: '/index.php'},
        {handler: 'reverse_proxy', upstreams: [{dial: 'backend:8080'}]},
      ],
      terminal: true,
    };

    const [site] = parseSitesFromConfig({
      apps: {
        http: {
          servers: {
            proxy: {routes: [route]},
          },
        },
      },
    });

    expect(site.routeConfig).toEqual(route);
    expect(site.upstream).toBe('http://backend:8080');
    expect(buildCaddyRoute(site)).toEqual(route);
  });

  it('does not mutate the stored route when assigning a route id', () => {
    const routeConfig = {
      match: [{host: ['example.com'], path: ['/files/*']}],
      handle: [{handler: 'file_server', root: '/srv/www'}],
    };

    const route = buildCaddyRoute({
      domain: 'example.com',
      upstream: 'http://unused:8080',
      routeId: 'files-route',
      routeConfig,
    });

    expect(route).toMatchObject({
      '@id': 'files-route',
      match: routeConfig.match,
      handle: routeConfig.handle,
    });
    expect(routeConfig).not.toHaveProperty('@id');
  });

  it('updates the host while preserving imported path matchers', () => {
    const route = buildCaddyRoute({
      domain: 'new.example.com',
      upstream: 'http://unused:8080',
      routeConfig: {
        '@id': 'api-route',
        match: [{host: ['old.example.com'], path: ['/api/*']}],
        handle: [{handler: 'reverse_proxy', upstreams: [{dial: 'backend:8080'}]}],
      },
    });

    expect(route).toMatchObject({
      match: [{host: ['new.example.com'], path: ['/api/*']}],
    });
  });

  it('preserves imported routes when generating the full server config', () => {
    const routeConfig = {
      '@id': 'files-route',
      match: [{host: ['example.com'], path: ['/files/*']}],
      handle: [{handler: 'file_server', root: '/srv/www'}],
    };

    const config = buildCaddyConfig({} as never, [{
      id: 'site-id',
      serverId: 'server-id',
      domain: 'example.com',
      upstream: 'http://unused:8080',
      routeId: 'files-route',
      routeConfig,
      tlsEnabled: false,
      synced: true,
      status: 'active',
      consecutiveFailures: 0,
      createdAt: '',
      updatedAt: '',
    }]);

    expect((config.apps as Record<string, unknown>)).toMatchObject({
      http: {
        servers: {
          proxy: {
            routes: [routeConfig],
          },
        },
      },
    });
  });
});
