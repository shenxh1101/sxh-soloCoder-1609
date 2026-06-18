import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'training-institute-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    name: string;
    phone: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  const queryToken = req.query.token as string;
  const token = headerToken || queryToken;

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: '认证令牌无效' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未认证' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    
    next();
  };
}

export function generateToken(user: any): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      phone: user.phone
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function getParentStudentIds(parentPhone: string): number[] {
  const db = getDb();
  const students = db.prepare(`
    SELECT id FROM students WHERE parent_phone = ?
  `).all(parentPhone) as { id: number }[];
  
  return students.map(s => s.id);
}
