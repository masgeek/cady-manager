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
  const allSites = await siteRepo.findAll();
  for (const site of allSites) {
    const alive = await pingSite(site.upstream);
    await siteRepo.updateStatus(site.id, alive ? 'active' : 'error');
  }
}

export function startSiteHealthJob(): void {
  if (task) return;
  task = cron.schedule('*/5 * * * *', () => {
    checkAllSites().catch(() => {});
  });
}

export function stopSiteHealthJob(): void {
  if (task) {
    task.stop();
    task = null;
  }
}
