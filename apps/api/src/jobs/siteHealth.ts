import cron, { type ScheduledTask } from 'node-cron';
import { siteRepo } from '@caddy-manager/db';

const PING_TIMEOUT = 5000;

let task: ScheduledTask | null = null;

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
  const started = Date.now();
  const allSites = await siteRepo.findAll();
  console.error(`[site-health] checking ${allSites.length} sites`);
  for (const site of allSites) {
    const alive = await pingSite(site.upstream);
    console.error(`[site-health] ${site.domain} (${site.upstream}) → ${alive ? 'active' : 'error'}`);
    await siteRepo.updateStatus(site.id, alive ? 'active' : 'error');
  }
  console.error(`[site-health] completed in ${Date.now() - started}ms`);
}

export function startSiteHealthJob(): void {
  if (task) return;
  console.error('[site-health] starting scheduled job (every 5 minutes)');
  task = cron.schedule('*/5 * * * *', () => {
    checkAllSites().catch((err) => console.error('[site-health] job failed', err));
  });
}

export function stopSiteHealthJob(): void {
  if (task) {
    task.stop();
    task = null;
  }
}
