import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'leopardx_super_admin_jwt_secret_key_2026_secure';
};

export interface AuthenticatedAdminRequest extends Request {
  admin?: {
    id: string;
    email: string;
  };
}

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenHeader = req.headers['authorization'] || req.headers['x-admin-token'];

    if (!tokenHeader) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const token = (tokenHeader as string).replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication token is empty.' });
      return;
    }

    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; email: string };

    if (!decoded || !decoded.id) {
      res.status(403).json({ success: false, message: 'Invalid or expired Super Admin token.' });
      return;
    }

    // Verify Super Admin status in DB
    const admin = await prisma.superAdmin.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      res.status(403).json({ success: false, message: 'Super Admin account is inactive or no longer exists.' });
      return;
    }

    (req as AuthenticatedAdminRequest).admin = { id: admin.id, email: admin.email };
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired Super Admin token.',
      error: error.message,
    });
  }
};
