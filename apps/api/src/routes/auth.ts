import { config } from '@caddy-manager/config';
import type { FastifyInstance } from 'fastify';
import { loginSchema, loginResponseSchema, toJsonSchema } from '../lib/schemas';
import { AppError } from '../lib/errors';

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post(
    '/auth/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Authenticate with username and password to receive a JWT token',
        security: [],
        body: {
          ...toJsonSchema(loginSchema),
          example: { username: 'admin', password: 'your-password' },
        },
        response: { 200: loginResponseSchema },
      },
    },
    async (request, reply) => {
      const { username, password } = loginSchema.parse(request.body);

      if (username !== config.authUsername || password !== config.authPassword) {
        throw new AppError(401, 'Invalid credentials');
      }

      const token = await reply.jwtSign({ username }, { expiresIn: '24h' });
      return { token, expiresIn: 86400 };
    },
  );
}
