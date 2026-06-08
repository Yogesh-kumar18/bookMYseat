import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "./config.js";
import { prisma } from "./db.js";

export function signToken(user: { id: string; role: Role }) {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: "7d" });
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ message: "Authentication required" });
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; role: Role };
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.status !== "ACTIVE") return res.status(401).json({ message: "Account unavailable" });
    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function allow(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: "Access denied" });
    next();
  };
}
