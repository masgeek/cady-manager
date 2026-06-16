import { FastifyError } from 'fastify';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super(404, `${entity} with id '${id}' not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  details?: unknown;
}

export function toApiErrorResponse(error: AppError): ApiErrorResponse {
  return {
    statusCode: error.statusCode,
    message: error.message,
    details: error.details,
  };
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function errorHandler(
  error: FastifyError | Error,
  _request: unknown,
  reply: unknown,
) {
  const fastifyReply = reply as {
    status: (code: number) => { send: (body: unknown) => void };
  };
  const request = _request as { log: { error: (msg: string) => void } };

  request.log.error(error.message);

  if (isAppError(error)) {
    return fastifyReply.status(error.statusCode).send(toApiErrorResponse(error));
  }

  const statusCode = (error as FastifyError).statusCode || 500;
  return fastifyReply.status(statusCode).send({
    statusCode,
    message: statusCode === 500 ? 'Internal Server Error' : error.message,
  });
}
