import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@caddy-manager/config', () => ({
  config: {
    caddyAdminToken: 'test-token',
    caddyAllowedHosts: ['caddy.test'],
  },
}));

import {CaddyProvider} from './caddy';

const fetchMock = vi.fn();

function response(body: unknown, options: {ok?: boolean; status?: number; statusText?: string} = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    text: vi.fn().mockResolvedValue(body === undefined ? '' : JSON.stringify(body)),
  };
}

describe('CaddyProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends authenticated requests to an allowlisted endpoint', async () => {
    fetchMock.mockResolvedValue(response({apps: {}}));
    const provider = new CaddyProvider({apiEndpoint: 'https://caddy.test:2019'});

    await provider.getConfig();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://caddy.test:2019/config/',
      expect.objectContaining({
        redirect: 'follow',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          Origin: 'http://localhost:2019',
        }),
      }),
    );
  });

  it('uses the selected server block when adding a route', async () => {
    fetchMock.mockResolvedValue(response(undefined));
    const provider = new CaddyProvider({apiEndpoint: 'https://caddy.test'});
    const route = {'@id': 'example-route', match: [{host: ['example.com']}]};

    await provider.addRoute('internal', route);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://caddy.test/config/apps/http/servers/internal/routes',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(route),
        headers: expect.objectContaining({'Content-Type': 'application/json'}),
      }),
    );
  });

  it('returns server block names from the Caddy response', async () => {
    fetchMock.mockResolvedValue(response({public: {}, internal: {}}));
    const provider = new CaddyProvider({apiEndpoint: 'https://caddy.test'});

    await expect(provider.getServerNames()).resolves.toEqual(['public', 'internal']);
  });

  it('surfaces Caddy error responses including the response body', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: vi.fn().mockResolvedValue('route missing'),
    });
    const provider = new CaddyProvider({apiEndpoint: 'https://caddy.test'});

    await expect(provider.deleteRouteByID('missing')).rejects.toThrow(
      'Caddy API error: 404 Not Found — route missing',
    );
  });
});
