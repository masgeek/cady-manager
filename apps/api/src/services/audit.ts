import type { AuditEvent, AuditAction, AuditEntity } from '@caddy-manager/shared-types';
import { db } from '../lib/db';

export async function recordAuditEvent(data: {
  userId?: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  details?: string;
  result?: 'success' | 'failure';
}): Promise<AuditEvent> {
  const row = await db
    .insertInto('audit_events')
    .values({
      user_id: data.userId || 'admin',
      action: data.action,
      entity: data.entity,
      entity_id: data.entityId ?? null,
      details: data.details ?? null,
      result: data.result ?? 'success',
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return {
    id: row.id,
    userId: row.user_id,
    action: row.action as AuditAction,
    entity: row.entity as AuditEntity,
    entityId: row.entity_id ?? undefined,
    details: row.details ?? undefined,
    result: row.result as 'success' | 'failure',
    timestamp: row.timestamp,
  };
}

export async function getAuditEvents(limit = 100): Promise<AuditEvent[]> {
  const rows = await db
    .selectFrom('audit_events')
    .selectAll()
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .execute();

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    action: row.action as AuditAction,
    entity: row.entity as AuditEntity,
    entityId: row.entity_id ?? undefined,
    details: row.details ?? undefined,
    result: row.result as 'success' | 'failure',
    timestamp: row.timestamp,
  }));
}
