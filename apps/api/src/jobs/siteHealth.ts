import cron, {type ScheduledTask} from 'node-cron';
import {serverRepo, siteRepo} from '@caddy-manager/db';
import {config} from '@caddy-manager/config';
import {CaddyProvider} from '../providers/caddy.js';
import {buildCaddyRoute} from '../services/config.js';
import {assertSafeHealthUrl} from '../lib/outbound.js';

const PING_TIMEOUT = 5000;

let task: ScheduledTask | null = null;
let running = false;
let activeRun: Promise<void> | null = null;

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

async function pingSite(url: string, headers?: Record<string, string>): Promise<{ alive: boolean; detail: string }> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), PING_TIMEOUT);
    try {
        const opts: RequestInit = {method: 'HEAD', redirect: 'follow', signal: controller.signal};
        if (headers && Object.keys(headers).length > 0) {
            opts.headers = headers;
        }
        const res = await fetch(url, opts);
        return {
            alive: res.ok,
            detail: `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ''}`,
        };
    } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        return {alive: false, detail: detail || 'Request failed'};
    } finally {
        clearTimeout(id);
    }
}

export async function checkAllSites(): Promise<void> {
    const started = Date.now();
    const allSites = await siteRepo.findAll();
    console.log(`[site-health] checking ${allSites.length} sites`);
    for (const site of allSites) {
        const checkedAt = new Date();
        const checkStarted = Date.now();
        const url = site.healthEndpoint || `https://${site.domain}`;
        const parsedHeaders = site.healthHeaders ? tryParseHeaders(site.healthHeaders) : undefined;
        let result: {alive: boolean; detail: string};
        try {
            await assertSafeHealthUrl(url);
            result = await pingSite(url, parsedHeaders);
        } catch (err) {
            result = {
                alive: false,
                detail: err instanceof Error ? err.message : String(err),
            };
        }
        if (result.alive) {
            console.log(`[site-health] ${site.domain} → active (${url})`);
        } else {
            console.error(`[site-health] ${site.domain} → error: ${result.detail} (${url})`);
        }
        await siteRepo.updateHealth(
            site.id,
            result.alive ? 'active' : 'error',
            result.detail,
            Date.now() - checkStarted,
            checkedAt,
            result.alive ? 0 : site.consecutiveFailures + 1,
        );
    }
    console.log(`[site-health] completed in ${Date.now() - started}ms`);
}

function routeContainsSite(route: Record<string, unknown>, site: {domain: string; routeId?: string}): boolean {
    if (site.routeId && route['@id'] === site.routeId) return true;

    const match = (route.match as Array<Record<string, unknown>> | undefined)?.[0];
    const hosts = match?.host as string[] | undefined;
    if (hosts?.includes(site.domain)) return true;

    const nestedRoutes = [
        ...(route.routes as Array<Record<string, unknown>> | undefined ?? []),
        ...((route.handle as Array<Record<string, unknown>> | undefined ?? [])
            .flatMap((handler) => handler.routes as Array<Record<string, unknown>> | undefined ?? [])),
    ];
    return nestedRoutes.some((nestedRoute) => routeContainsSite(nestedRoute, site));
}

export function configContainsSite(
    configData: Record<string, unknown>,
    site: {domain: string; routeId?: string},
    serverName?: string,
): boolean {
    const apps = configData.apps as Record<string, unknown> | undefined;
    const http = apps?.http as Record<string, unknown> | undefined;
    const servers = http?.servers as Record<string, unknown> | undefined;
    if (!servers) return false;

    return Object.entries(servers).some(([name, server]) => {
        if (serverName && name !== serverName) return false;
        const routes = (server as Record<string, unknown>).routes as Array<Record<string, unknown>> | undefined;
        return routes?.some((route) => routeContainsSite(route, site)) ?? false;
    });
}

export async function reconcileAllSites(): Promise<void> {
    const servers = await serverRepo.findAll();
    let repaired = 0;

    for (const server of servers) {
        try {
            const provider = new CaddyProvider({apiEndpoint: server.apiEndpoint});
            const [config, serverNames] = await Promise.all([
                provider.getConfig(),
                provider.getServerNames(),
            ]);
            const sites = await siteRepo.findAll(server.id);
            for (const site of sites) {
                const serverName = site.caddyServerName ?? serverNames[0];
                if (!serverName) continue;
                if (!serverNames.includes(serverName)) {
                    console.error(`[site-sync] Caddy server block not found: ${serverName} (${server.name})`);
                    continue;
                }
                if (configContainsSite(config, site, serverName)) continue;

                const routeId = site.routeId || site.domain.replace(/[^a-zA-Z0-9_-]/g, '_');
                await provider.addRoute(serverName, buildCaddyRoute({...site, routeId}));
                const updates = {
                    ...(site.routeId ? {} : {routeId}),
                    ...(site.caddyServerName ? {} : {caddyServerName: serverName}),
                };
                if (Object.keys(updates).length > 0) await siteRepo.update(site.id, updates);
                await siteRepo.updateSyncedStatus(site.id, true);
                repaired++;
                console.log(`[site-sync] recreated missing route for ${site.domain}`);
            }
        } catch (err) {
            console.error(`[site-sync] failed for server ${server.name}`, err);
        }
    }

    console.log(`[site-sync] checked ${servers.length} servers, recreated ${repaired} routes`);
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

    const expression = config.siteCheckCron;
    console.log(`[site-health] starting scheduled job (${describeCron(expression)})`);
    task = cron.schedule(expression, () => {
        if (running) return;
        running = true;
        const run = Promise.resolve()
            .then(() => checkAllSites())
            .then(() => reconcileAllSites())
            .catch((err) => console.error('[site-health] job failed', err))
        activeRun = run;
        void run.finally(() => {
            running = false;
            if (activeRun === run) activeRun = null;
        });
    });
}

export async function stopSiteHealthJob(): Promise<void> {
    if (task) {
        task.stop();
        task = null;
    }
    if (activeRun) await activeRun;
}
