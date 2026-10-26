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

// Ensure at least one administrator and one demo user exist
export async function seedInitialAdmin(): Promise<void> {
  const db = dbManager.get();
  const adminExists = db.users.some(u => u.role === 'admin' || u.email === 'admin@planetx.nmims.edu');
  
  if (!adminExists) {
    const adminHash = await hashPassword('Admin@PlanetX2026');
    const adminUser: UserProfile = {
      id: 'usr-admin-primary',
      email: 'admin@planetx.nmims.edu',
      passwordHash: adminHash,
      name: 'PLANET-X Administrator',
      phone: '+91 9876543210',
      college: "SVKM's NMIMS Global University, Dhule",
      role: 'admin',
      emailVerified: true,
      createdAt: new Date().toISOString()
    };

    dbManager.update(d => {
      d.users.push(adminUser);
    });
    console.log('Admin account initialized: admin@planetx.nmims.edu');
  }

  // Also seed a demo participant if none exists
  const demoExists = db.users.some(u => u.email === 'participant@example.com');
  if (!demoExists) {
    const demoHash = await hashPassword('Participant@2026');
    const demoUser: UserProfile = {
      id: 'usr-demo-participant',
      email: 'participant@example.com',
      passwordHash: demoHash,
      name: 'Aarav Sharma',
      phone: '+91 9823456780',
      college: "SVKM's NMIMS Dhule",
      role: 'participant',
      emailVerified: true,
      createdAt: new Date().toISOString()
    };

    dbManager.update(d => {
      d.users.push(demoUser);
    });
  }
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
