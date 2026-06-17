import cron, { type ScheduledTask } from 'node-cron';
import { siteRepo } from '@caddy-manager/db';

const PING_TIMEOUT = 5000;

let task: ScheduledTask | null = null;

async function pingSite(url: string): Promise<{ alive: boolean; error?: string }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), PING_TIMEOUT);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    return { alive: res.ok };
  } catch (err) {
    return { alive: false, error: String(err) };
  } finally {
    clearTimeout(id);
  }
}

export async function checkAllSites(): Promise<void> {
  const started = Date.now();
  const allSites = await siteRepo.findAll();
  console.log(`[site-health] checking ${allSites.length} sites`);
  for (const site of allSites) {
    const result = await pingSite(site.upstream);
    if (result.alive) {
      console.log(`[site-health] ${site.domain} (${site.upstream}) → active`);
    } else {
      console.error(`[site-health] ${site.domain} (${site.upstream}) → error: ${result.error}`);
    }
    await siteRepo.updateStatus(site.id, result.alive ? 'active' : 'error');
  }
  console.log(`[site-health] completed in ${Date.now() - started}ms`);
}

export function startSiteHealthJob(): void {
  if (task) return;
  console.log('[site-health] starting scheduled job (every 5 minutes)');
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
