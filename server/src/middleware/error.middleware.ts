import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Error]', err);

  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (
    message.includes('Prisma') ||
    message.includes('database server') ||
    message.includes("Can't reach database")
  ) {
    message = 'Database service temporarily unavailable. Please verify database connection.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
