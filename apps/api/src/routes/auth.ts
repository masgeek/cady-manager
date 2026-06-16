import { config } from '@caddy-manager/config';
import type { FastifyInstance } from 'fastify';

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (request, reply) => {
    const { username, password } = request.body as Record<string, string | undefined>;

    if (!username || !password) {
      return reply.status(400).send({ statusCode: 400, message: 'Username and password are required' });
    }

    if (username !== config.authUsername || password !== config.authPassword) {
      return reply.status(401).send({ statusCode: 401, message: 'Invalid credentials' });
    }

    const token = await reply.jwtSign({ username });
    return { token };
  });
}
