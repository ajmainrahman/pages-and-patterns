import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";

export interface AuthPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = (req as Request & { cookies: Record<string, string> }).cookies?.token;

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
