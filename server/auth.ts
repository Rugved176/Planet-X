import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { dbManager, UserProfile } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'planet-x-2026-super-cosmic-secure-secret-key-nmims';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'participant' | 'admin';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Ensure fixed official administrator exists
export async function seedInitialAdmin(): Promise<void> {
  const db = dbManager.get();
  const svkmHash = await hashPassword('SVKM');
  
  dbManager.update(d => {
    // 1. Ensure planetx.event@gmail.com has fixed password SVKM and admin role
    const primaryAdmin = d.users.find(u => u.email.toLowerCase() === 'planetx.event@gmail.com');
    if (primaryAdmin) {
      primaryAdmin.passwordHash = svkmHash;
      primaryAdmin.role = 'admin';
      primaryAdmin.name = 'PLANET-X Administrator';
      primaryAdmin.phone = '+91 9975952579';
    } else {
      d.users.push({
        id: 'usr-admin-planetx',
        email: 'planetx.event@gmail.com',
        passwordHash: svkmHash,
        name: 'PLANET-X Administrator',
        phone: '+91 9975952579',
        college: "SVKM's NMIMS Global University, Dhule",
        role: 'admin',
        emailVerified: true,
        createdAt: new Date().toISOString()
      });
    }

    // 2. Also ensure rugvedsolanki6@gmail.com has admin role if present
    const rugvedUser = d.users.find(u => u.email.toLowerCase() === 'rugvedsolanki6@gmail.com');
    if (rugvedUser) {
      rugvedUser.role = 'admin';
    }

    // 3. Remove demo registrations and demo participant
    d.users = d.users.filter(u => u.email !== 'participant@example.com');
    d.registrations = d.registrations.filter(r => r.userId !== 'usr-demo-participant' && !r.id.includes('7757'));
  });

  console.log('Fixed Admin account verified: planetx.event@gmail.com (Password: SVKM)');
}

// Authentication middleware
export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired session token' });
    return;
  }

  const db = dbManager.get();
  const user = db.users.find(u => u.id === payload.userId);
  if (!user) {
    res.status(401).json({ error: 'User account not found' });
    return;
  }

  req.user = user;
  next();
}

export function adminOnlyMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  authMiddleware(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Unauthorized: Administrator access required' });
      return;
    }
    next();
  });
}
