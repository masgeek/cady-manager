import { z } from 'zod';
import {
  createServerSchema,
  updateServerSchema,
  createSiteSchema,
  updateSiteSchema,
} from '@caddy-manager/db';

export {
  createServerSchema,
  updateServerSchema,
  createSiteSchema,
  updateSiteSchema,
};

export const serverParamsSchema = z.object({
  id: z.string().uuid(),
});

export const siteParamsSchema = z.object({
  id: z.string().uuid(),
});

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
