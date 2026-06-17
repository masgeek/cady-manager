import { siteRepo } from '@caddy-manager/db';

const PING_TIMEOUT = 5000;
const CHECK_INTERVAL_MS = 60_000;

let intervalHandle: ReturnType<typeof setInterval> | null = null;

async function pingSite(url: string): Promise<boolean> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), PING_TIMEOUT);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(id);
  }
}

export async function checkAllSites(): Promise<void> {
  const allSites = await siteRepo.findAll();
  for (const site of allSites) {
    const upstream = site.upstream;
    const alive = await pingSite(upstream);
    await siteRepo.updateStatus(site.id, alive ? 'active' : 'error');
  }
}

export function startSiteHealthChecker(): void {
  if (intervalHandle) return;
  checkAllSites();
  intervalHandle = setInterval(checkAllSites, CHECK_INTERVAL_MS);
}

export function stopSiteHealthChecker(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
