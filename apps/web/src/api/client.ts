import { ApiClient } from "@caddy-manager/shared-api";

function createClient(): ApiClient {
  const saved = localStorage.getItem("token");
  return new ApiClient("/api", saved ?? undefined);
}

export let api: ApiClient = createClient();

export function setApiClient(client: ApiClient) {
  api = client;
}
