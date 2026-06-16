import { randomUUID } from 'node:crypto';
import type { AuditEvent, AuditAction, AuditEntity } from '@caddy-manager/shared-types';

interface AuditRow {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  result: string;
  timestamp: string;
}

const events: AuditRow[] = [];
const MAX_EVENTS = 1000;

export async function recordAuditEvent(data: {
  userId?: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  details?: string;
  result?: 'success' | 'failure';
}): Promise<AuditEvent> {
  const event: AuditRow = {
    id: randomUUID(),
    userId: data.userId || 'admin',
    action: data.action,
    entity: data.entity,
    entityId: data.entityId ?? null,
    details: data.details ?? null,
    result: data.result ?? 'success',
    timestamp: new Date().toISOString(),
  };

  events.unshift(event);
  if (events.length > MAX_EVENTS) {
    events.length = MAX_EVENTS;
  }

  return toEvent(event);
}

function toEvent(row: AuditRow): AuditEvent {
  return {
    id: row.id,
    userId: row.userId,
    action: row.action as AuditAction,
    entity: row.entity as AuditEntity,
    entityId: row.entityId ?? undefined,
    details: row.details ?? undefined,
    result: row.result as 'success' | 'failure',
    timestamp: row.timestamp,
  };
}

export async function getAuditEvents(limit = 100): Promise<AuditEvent[]> {
  return events.slice(0, limit).map(toEvent);
}
