import { config } from '@caddy-manager/config';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fjwt from '@fastify/jwt';
import { UnauthorizedError } from '../lib/errors.js';

export async function registerAuth(app: FastifyInstance) {
  await app.register(fjwt, { secret: config.jwtSecret });

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  });
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { username: string };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
