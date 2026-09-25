import { Request, Response } from 'express';

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'The requested endpoint does not exist',
    code: 'NOT_FOUND'
  });
};
