// api/lib/auth.ts - Authentication middleware
import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends VercelRequest {
  user?: any;
}

export async function authenticate(req: AuthRequest, res: VercelResponse) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    return true;
  } catch (error: any) {
    return res.status(401).json({ success: false, message: 'Invalid token', error: error.message });
  }
}

export async function isAdmin(req: AuthRequest, res: VercelResponse) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  return true;
}
