import { z } from 'zod';
import type { ZodSchema } from 'zod';

export function buildJsonResponse<T extends ZodSchema>(schema: T) {
  return {
    200: {
      type: 'object',
      properties: {
        data: schema.description ? {} : {},
      },
    },
  };
}

// --- Server Schemas ---

export const createServerSchema = z.object({
  name: z.string().min(1).max(100),
  hostname: z.string().min(1).max(255),
  apiEndpoint: z.string().url(),
});

export const updateServerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  hostname: z.string().min(1).max(255).optional(),
  apiEndpoint: z.string().url().optional(),
});

export const serverParamsSchema = z.object({
  id: z.string().uuid(),
});

// --- Site Schemas ---

export const createSiteSchema = z.object({
  serverId: z.string().uuid(),
  domain: z.string().min(1).max(255),
  upstream: z.string().url(),
  tlsEnabled: z.boolean(),
});

export const updateSiteSchema = z.object({
  domain: z.string().min(1).max(255).optional(),
  upstream: z.string().url().optional(),
  tlsEnabled: z.boolean().optional(),
});

export const siteParamsSchema = z.object({
  id: z.string().uuid(),
});

// --- Query Schemas ---

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const logQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  search: z.string().optional(),
});

export const auditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
});
