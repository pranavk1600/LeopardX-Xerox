import { Request, Response, NextFunction } from 'express';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'leopardx_admin_secret_token_2026';

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const tokenHeader = req.headers['x-admin-token'] || req.headers['authorization'];

  if (!tokenHeader) {
    res.status(401).json({ success: false, message: 'Admin authentication token required' });
    return;
  }

  const token = (tokenHeader as string).replace(/^Bearer\s+/i, '').trim();

  if (token !== ADMIN_TOKEN && token !== ADMIN_PASSCODE) {
    res.status(403).json({ success: false, message: 'Invalid or expired Admin credentials' });
    return;
  }

  next();
};
