import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "./db.js";

export const asyncRoute = (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => void handler(req, res, next).catch(next);

export const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function uniqueSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let count = 1;
  while (await prisma.library.findUnique({ where: { slug } })) slug = `${base}-${++count}`;
  return slug;
}

export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  return schema.parse(body);
}
