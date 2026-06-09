import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/bookmyseat"),
  JWT_SECRET: z.string().min(32).default("development-only-secret-change-me-now"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("BookMySeat <noreply@bookmyseat.in>"),
  SUPPORT_EMAIL: z.string().email().default("support@bookmyseat.in")
}).superRefine((value, ctx) => {
  if (value.NODE_ENV === "production" && value.JWT_SECRET === "development-only-secret-change-me-now") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["JWT_SECRET"], message: "Set a production JWT_SECRET before starting the API." });
  }
  if (value.NODE_ENV === "production" && value.DATABASE_URL.startsWith("file:")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["DATABASE_URL"], message: "Use PostgreSQL for production DATABASE_URL." });
  }
});

export const env = schema.parse(process.env);
export const clientOrigins = env.CLIENT_URL.split(",").map((item) => item.trim().replace(/\/+$/, "")).filter(Boolean);
export const primaryClientOrigin = clientOrigins[0] || "http://localhost:5173";
