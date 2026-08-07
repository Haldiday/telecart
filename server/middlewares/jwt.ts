import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import type { AuthRequest } from '../types/index.js';

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('[jwt] authHeader', authHeader);
  console.log('[jwt] token', token);
  console.log('[jwt] secret', config.jwt.secret);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
    };
    console.log('[jwt] decoded', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('[jwt] verify error', error);
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}
