import { ApiClient } from '@caddy-manager/shared-api';

function createClient(): ApiClient {
  const saved = localStorage.getItem('auth');
  if (saved) {
    try {
      const { username, password } = JSON.parse(saved);
      return new ApiClient('/api', username, password);
    } catch {
      // ignore
    }
  }
  return new ApiClient('/api', 'admin', 'admin');
}

export let api: ApiClient = createClient();

export function setApiClient(client: ApiClient) {
  api = client;
}
