import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import prisma from './db';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export async function authenticate(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return false;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return false;
    }

    // Attach user to request
    (req as any).user = user;
    return true;
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return false;
  }
}

export function requireRole(roles: string[]) {
  return async (req: VercelRequest, res: VercelResponse): Promise<boolean> => {
    const authResult = await authenticate(req, res);
    if (!authResult) return false;

    const user = (req as any).user;
    if (!roles.includes(user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return false;
    }

    return true;
  };
}