import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Known application errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      ...(error.details ? { details: error.details } : {})
    });
  }

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as unknown as { code: string; meta?: { field_name?: string } };
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A record with this value already exists',
        code: 'DUPLICATE_ENTRY',
        details: { field: prismaError.meta?.field_name }
      });
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
        code: 'NOT_FOUND'
      });
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  // Unknown errors — don't expose internals
  logger.error('Unhandled error:', error);
  return res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Please try again later.',
    code: 'INTERNAL_SERVER_ERROR'
  });
};
