import { config } from '@caddy-manager/config';
import type { FastifyInstance } from 'fastify';
import fastifyAuth from '@fastify/auth';
import fastifyBasicAuth from '@fastify/basic-auth';
import { UnauthorizedError } from '../lib/errors.js';

const ADMIN_USERNAME = config.authUsername;
const ADMIN_PASSWORD = config.authPassword;

export async function registerAuth(app: FastifyInstance) {
  await app.register(fastifyBasicAuth, {
    validate: async (username: string, password: string) => {
      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        throw new UnauthorizedError('Invalid credentials');
      }
    },
    authenticate: true,
  });

  await app.register(fastifyAuth);

  app.decorate('authenticate', async (request: unknown, reply: unknown) => {
    const req = request as { basicAuthUser?: string };
    const rep = reply as {
      unauthorized: (message: string) => void;
    };
    if (!req.basicAuthUser) {
      rep.unauthorized('Missing authentication');
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: unknown,
      reply: unknown,
    ) => Promise<void>;
  }
}
