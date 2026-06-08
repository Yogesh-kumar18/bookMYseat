import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(10).max(15).optional(),
  password: z.string().min(8).max(72),
  role: z.enum(["STUDENT", "OWNER"]).default("STUDENT")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const librarySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(20).max(1500),
  address: z.string().min(3).max(250),
  area: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: z.string().max(10).optional(),
  phone: z.string().min(10).max(15),
  whatsapp: z.string().min(10).max(15).optional(),
  timings: z.string().min(3).max(100),
  capacity: z.number().int().positive().max(10000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  facilities: z.array(z.string().min(1)).min(1),
  pricing: z.array(z.object({ name: z.string().min(1), amount: z.number().int().nonnegative() })).min(1)
});
