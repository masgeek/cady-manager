import cron, {type ScheduledTask} from 'node-cron';
import {siteRepo} from '@caddy-manager/db';

const PING_TIMEOUT = 5000;

let task: ScheduledTask | null = null;

function describeCron(expression: string): string {
    const parts = expression.trim().split(/\s+/);
    if (parts.length < 5) return expression;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    const weekdays: Record<string, string> = {
        '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
        '4': 'Thursday', '5': 'Friday', '6': 'Saturday', '7': 'Sunday',
    };

    const months: Record<string, string> = {
        '1': 'January', '2': 'February', '3': 'March', '4': 'April',
        '5': 'May', '6': 'June', '7': 'July', '8': 'August',
        '9': 'September', '10': 'October', '11': 'November', '12': 'December',
    };

    const fmtTime = (h: string, m: string) => `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    const hasTime = hour !== '*' && minute !== '*';
    const timeStr = hasTime ? fmtTime(hour, minute) : '';

    if (minute.startsWith('*/') && hour === '*' && dayOfWeek === '*' && dayOfMonth === '*' && month === '*') {
        return `Every ${minute.slice(2)} minutes`;
    }

    if (hour.startsWith('*/') && minute === '0' && dayOfWeek === '*' && dayOfMonth === '*' && month === '*') {
        return `Every ${hour.slice(2)} hours`;
    }

    if (dayOfWeek !== '*' && dayOfMonth !== '*') {
        const dow = weekdays[dayOfWeek] ?? `day ${dayOfWeek}`;
        const dom = dayOfMonth === 'L' ? 'last day' : `day ${dayOfMonth}`;
        return hasTime
            ? `${dow} and on ${dom} at ${timeStr}`
            : `${dow} and on ${dom}`;
    }

    if (month !== '*') {
        return hasTime
            ? `Every ${months[month] ?? month} at ${timeStr}`
            : `Every ${months[month] ?? month}`;
    }

    if (dayOfWeek !== '*') {
        const dow = weekdays[dayOfWeek] ?? `day ${dayOfWeek}`;
        return hasTime ? `Every ${dow} at ${timeStr}` : `Every ${dow}`;
    }

    if (dayOfMonth !== '*') {
        const dom = dayOfMonth === 'L' ? 'last day' : `day ${dayOfMonth}`;
        return hasTime ? `On ${dom} of every month at ${timeStr}` : `On ${dom} of every month`;
    }

    return hasTime ? `Every day at ${timeStr}` : `Every day`;
}

async function pingSite(url: string, headers?: Record<string, string>): Promise<{ alive: boolean; error?: string }> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), PING_TIMEOUT);
    try {
        const opts: RequestInit = {method: 'HEAD', redirect: 'follow', signal: controller.signal};
        if (headers && Object.keys(headers).length > 0) {
            opts.headers = headers;
        }
        const res = await fetch(url, opts);
        return {alive: res.ok};
    } catch (err) {
        return {alive: false, error: String(err)};
    } finally {
        clearTimeout(id);
    }
}

export async function checkAllSites(): Promise<void> {
    const started = Date.now();
    const allSites = await siteRepo.findAll();
    console.log(`[site-health] checking ${allSites.length} sites`);
    for (const site of allSites) {
        const url = site.healthEndpoint || `https://${site.domain}`;
        const parsedHeaders = site.healthHeaders ? tryParseHeaders(site.healthHeaders) : undefined;
        const result = await pingSite(url, parsedHeaders);
        if (result.alive) {
            console.log(`[site-health] ${site.domain} → active (${url})`);
        } else {
            console.error(`[site-health] ${site.domain} → error: ${result.error} (${url})`);
        }
        await siteRepo.updateStatus(site.id, result.alive ? 'active' : 'error');
    }
    console.log(`[site-health] completed in ${Date.now() - started}ms`);
}

function tryParseHeaders(raw: string): Record<string, string> | undefined {
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, string>;
        }
    } catch { /* invalid JSON, ignore */ }
    return undefined;
}

export function startSiteHealthJob(): void {
    if (task) return;

    const expression = '*/5 * * * *'
    console.log(`[site-health] starting scheduled job (${describeCron(expression)})`);
    task = cron.schedule(expression, () => {
        checkAllSites().catch((err) => console.error('[site-health] job failed', err));
    });
}

export function stopSiteHealthJob(): void {
    if (task) {
        task.stop();
        task = null;
    }
}
