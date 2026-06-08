import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { ZodError, z } from "zod";
import { parse } from "csv-parse/sync";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { env } from "./config.js";
import { prisma } from "./db.js";
import { allow, authenticate, signToken } from "./auth.js";
import { sendMembershipApprovedEmail, sendOwnerRegistrationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "./email.js";
import { asyncRoute, parseBody, uniqueSlug } from "./utils.js";
import { librarySchema, loginSchema, registerSchema } from "./schemas.js";

const app = express();
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// For development, allow all origins. For production, use CLIENT_URL from env
const corsOrigins = env.NODE_ENV === "development" ? true : env.CLIENT_URL.split(",").map((item) => item.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60_000, limit: 40, standardHeaders: true }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
if (env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });
}

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "bookmyseat-api" }));

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const data = parseBody(registerSchema, req.body);
  const email = data.email.toLowerCase();
  const phone = data.phone?.trim() || undefined;
  const exists = await prisma.user.findFirst({ where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] } });
  if (exists) return res.status(409).json({ message: "Email or phone is already registered" });
  const { password, ...profile } = data;
  const user = await prisma.user.create({
    data: { ...profile, email, phone, passwordHash: await bcrypt.hash(password, 12) },
    select: { id: true, name: true, email: true, phone: true, role: true, isPro: true }
  });
  const welcomeEmail = await sendWelcomeEmail(user.email, user.name);
  const ownerEmail = user.role === "OWNER" ? await sendOwnerRegistrationEmail(user.email, user.name) : undefined;
  res.status(201).json({ user, token: signToken(user), emailStatus: { welcome: welcomeEmail, ownerRegistration: ownerEmail } });
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const data = parseBody(loginSchema, req.body);
  const found = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (!found || !(await bcrypt.compare(data.password, found.passwordHash))) return res.status(401).json({ message: "Incorrect email or password" });
  if (found.status !== "ACTIVE") return res.status(403).json({ message: "This account is suspended" });
  const user = { id: found.id, name: found.name, email: found.email, phone: found.phone, role: found.role, isPro: found.isPro };
  res.json({ user, token: signToken(user) });
}));

app.post("/api/auth/forgot-password", asyncRoute(async (req, res) => {
  const data = z.object({ email: z.string().email() }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  
  // Always return success message for security (don't reveal if email exists)
  if (!user) return res.status(200).json({ message: "Password reset link sent. Check your email." });
  
  // Invalidate any existing tokens
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  
  // Generate new reset token (secure random)
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  
  // Create token with 15 minute expiry
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await prisma.passwordResetToken.create({
    data: { userId: user.id, token: hashedToken, expiresAt }
  });
  
  const resetLink = `${env.CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
  const emailStatus = await sendPasswordResetEmail(user.email, user.name, resetLink);
  if (!emailStatus.ok) return res.status(503).json({ message: "Email delivery failed. Please try again later.", emailStatus });
  
  res.status(200).json({ message: emailStatus.skipped ? "Password reset email skipped in local development." : "Password reset link sent. Check your email.", emailStatus });
}));

app.post("/api/auth/reset-password", asyncRoute(async (req, res) => {
  const data = z.object({
    token: z.string().min(1),
    email: z.string().email(),
    newPassword: z.string().min(8).max(72)
  }).parse(req.body);
  
  // Hash the provided token to compare with stored hash
  const hashedToken = crypto.createHash("sha256").update(data.token).digest("hex");
  
  // Find the reset token
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
    include: { user: true }
  });
  
  if (!resetToken) return res.status(400).json({ message: "Invalid or expired reset link." });
  if (resetToken.user.email !== data.email.toLowerCase()) return res.status(400).json({ message: "Email mismatch." });
  if (new Date() > resetToken.expiresAt) return res.status(400).json({ message: "Reset link has expired." });
  if (resetToken.usedAt) return res.status(400).json({ message: "This reset link has already been used." });
  
  // Hash new password and update user
  const newPasswordHash = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({
    where: { id: resetToken.user.id },
    data: { passwordHash: newPasswordHash }
  });
  
  // Mark token as used
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() }
  });
  
  res.status(200).json({ message: "Password reset successful. You can now log in." });
}));

app.get("/api/me", authenticate, asyncRoute(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, phone: true, role: true, isPro: true, createdAt: true }
  });
  res.json(user);
}));

app.get("/api/settings", authenticate, asyncRoute(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { notificationPrefs: true, libraries: { take: 1 } }
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  
  const result: any = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    notificationPrefs: user.notificationPrefs || {
      announcements: true,
      bookingUpdates: true,
      complaintUpdates: true,
      membershipReminders: true
    }
  };
  
  // If student, add membership info
  if (user.role === "STUDENT") {
    const latestMembership = await prisma.studentMembership.findFirst({
      where: { studentId: user.id },
      include: { library: { select: { name: true, id: true } }, seat: true },
      orderBy: { createdAt: "desc" }
    });
    result.currentMembership = latestMembership;
  }
  
  // If owner, add library info
  if (user.role === "OWNER") {
    const library = user.libraries[0];
    if (library) {
      result.library = library;
    }
  }
  
  res.json(result);
}));

app.patch("/api/settings", authenticate, asyncRoute(async (req, res) => {
  const data = z.object({
    name: z.string().min(2).max(80).optional(),
    phone: z.string().min(10).max(15).optional(),
    notificationPrefs: z.object({
      announcements: z.boolean().optional(),
      bookingUpdates: z.boolean().optional(),
      complaintUpdates: z.boolean().optional(),
      membershipReminders: z.boolean().optional()
    }).optional()
  }).parse(req.body);
  
  // Update user info
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.phone !== undefined) {
    const phone = data.phone.trim() || null;
    if (phone) {
      const existing = await prisma.user.findFirst({ where: { phone, id: { not: req.user!.id } } });
      if (existing) return res.status(409).json({ message: "Phone is already registered" });
    }
    updateData.phone = phone;
  }
  
  await prisma.user.update({
    where: { id: req.user!.id },
    data: updateData
  });
  
  // Update notification preferences
  if (data.notificationPrefs) {
    await prisma.userNotificationPrefs.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id, ...data.notificationPrefs },
      update: data.notificationPrefs
    });
  }
  
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, phone: true, role: true, isPro: true }
  });
  res.json(user);
}));

app.post("/api/settings/change-password", authenticate, asyncRoute(async (req, res) => {
  const data = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72)
  }).parse(req.body);
  
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ message: "User not found" });
  
  // Verify current password
  const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!isValid) return res.status(401).json({ message: "Current password is incorrect." });
  
  // Hash and update new password
  const newPasswordHash = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash }
  });
  
  res.json({ message: "Password changed successfully." });
}));

app.get("/api/settings/owner", authenticate, allow("OWNER"), asyncRoute(async (req, res) => {
  const library = await prisma.library.findFirst({
    where: { ownerId: req.user!.id }
  });
  
  if (!library) return res.status(404).json({ message: "Library not found" });
  
  res.json(library);
}));

app.patch("/api/settings/owner", authenticate, allow("OWNER"), asyncRoute(async (req, res) => {
  const data = z.object({
    name: z.string().min(2).max(120).optional(),
    address: z.string().min(3).max(250).optional(),
    phone: z.string().min(10).max(15).optional(),
    timings: z.string().min(3).max(100).optional(),
    capacity: z.number().int().positive().max(10000).optional(),
    facilities: z.array(z.string().min(1)).min(1).optional(),
    pricing: z.array(z.object({ name: z.string().min(1), amount: z.number().int().nonnegative() })).min(1).optional(),
    images: z.array(z.string().url()).max(12).optional()
  }).parse(req.body);
  
  const library = await prisma.library.findFirst({
    where: { ownerId: req.user!.id }
  });
  
  if (!library) return res.status(404).json({ message: "Library not found" });
  
  const { images, ...libraryData } = data;
  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.library.update({ where: { id: library.id }, data: libraryData });
    if (images) {
      await tx.libraryImage.deleteMany({ where: { libraryId: library.id, publicId: null } });
      if (images.length) {
        await tx.libraryImage.createMany({
          data: images.map((url, index) => ({ libraryId: library.id, url, isCover: index === 0 }))
        });
      }
    }
    return saved;
  });
  
  res.json(updated);
}));

app.get("/api/libraries", asyncRoute(async (req, res) => {
  const search = String(req.query.search ?? "").trim();
  const city = String(req.query.city ?? "").trim();
  const facility = String(req.query.facility ?? "").trim();
  const libraries = await prisma.library.findMany({
    where: {
      status: "ACTIVE",
      ...(city ? { city: { equals: city } } : {}),
      ...(search ? { OR: [{ name: { contains: search } }, { area: { contains: search } }, { city: { contains: search } }] } : {})
    },
    include: { images: true, reviews: { select: { rating: true } }, _count: { select: { seats: true } } },
    orderBy: { createdAt: "asc" }
  });
  const result = libraries
    .filter((library) => !facility || (library.facilities as string[]).some((item) => item.toLowerCase().includes(facility.toLowerCase())))
    .map(({ reviews, ...library }) => ({
      ...library,
      rating: reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null,
      reviewCount: reviews.length
    }));
  res.json(result);
}));

app.get("/api/libraries/:slug", asyncRoute(async (req, res) => {
  const slug = String(req.params.slug);
  const library = await prisma.library.findFirst({
    where: { OR: [{ slug }, { id: slug }], status: "ACTIVE" },
    include: {
      images: true,
      reviews: { include: { student: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      announcements: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { seats: true, memberships: true } }
    }
  });
  if (!library) return res.status(404).json({ message: "Library not found" });
  res.json(library);
}));

app.post("/api/libraries", authenticate, allow("OWNER"), asyncRoute(async (req, res) => {
  const data = parseBody(librarySchema, req.body);
  const library = await prisma.library.create({ data: { ...data, slug: await uniqueSlug(data.name), ownerId: req.user!.id } });
  if (data.capacity) {
    await prisma.seat.createMany({ data: Array.from({ length: data.capacity }, (_, i) => ({ libraryId: library.id, number: String(i + 1) })) });
  }
  res.status(201).json(library);
}));

app.patch("/api/libraries/:id", authenticate, allow("OWNER", "ADMIN"), asyncRoute(async (req, res) => {
  const current = await prisma.library.findUnique({ where: { id: String(req.params.id) } });
  if (!current) return res.status(404).json({ message: "Library not found" });
  if (req.user!.role === "OWNER" && current.ownerId !== req.user!.id) return res.status(403).json({ message: "Access denied" });
  const data = librarySchema.partial().parse(req.body);
  res.json(await prisma.library.update({ where: { id: current.id }, data }));
}));

app.post("/api/libraries/:id/images", authenticate, allow("OWNER"), upload.array("images", 8), asyncRoute(async (req, res) => {
  const library = await prisma.library.findFirst({ where: { id: String(req.params.id), ownerId: req.user!.id } });
  if (!library) return res.status(404).json({ message: "Library not found" });
  if (!env.CLOUDINARY_CLOUD_NAME) return res.status(503).json({ message: "Cloudinary is not configured" });
  const files = (req.files as Express.Multer.File[]) ?? [];
  const records = [];
  for (const file of files) {
    const uploaded = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: `bookmyseat/${library.id}` }, (error, result) => {
        if (error || !result) reject(error); else resolve(result as { secure_url: string; public_id: string });
      });
      stream.end(file.buffer);
    });
    records.push(await prisma.libraryImage.create({ data: { libraryId: library.id, url: uploaded.secure_url, publicId: uploaded.public_id, isCover: records.length === 0 } }));
  }
  res.status(201).json(records);
}));

app.post("/api/libraries/:id/bookings", authenticate, allow("STUDENT"), asyncRoute(async (req, res) => {
  const data = z.object({ planName: z.string().max(100).optional(), message: z.string().max(500).optional(), waitlist: z.boolean().default(false) }).parse(req.body);
  const library = await prisma.library.findFirst({ where: { id: String(req.params.id), status: "ACTIVE" } });
  if (!library) return res.status(404).json({ message: "Library not found" });
  const existingMembership = await prisma.studentMembership.findUnique({ where: { studentId_libraryId: { studentId: req.user!.id, libraryId: library.id } } });
  if (existingMembership) return res.status(409).json({ message: "You already have a membership at this library." });
  const existingBooking = await prisma.booking.findFirst({
    where: { studentId: req.user!.id, libraryId: library.id, status: { in: ["PENDING", "WAITLISTED", "APPROVED"] } }
  });
  if (existingBooking) return res.status(409).json({ message: "You already have an active booking request for this library." });
  const booking = await prisma.booking.create({ data: { studentId: req.user!.id, libraryId: library.id, planName: data.planName, message: data.message, status: data.waitlist ? "WAITLISTED" : "PENDING" } });
  if (library.ownerId) {
    const student = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
    await prisma.notification.create({
      data: {
        userId: library.ownerId, type: "BOOKING", entityId: booking.id, actionPath: "/notifications",
        title: "New booking request", message: `${student?.name ?? "A student"} requested a seat at ${library.name}.`
      }
    });
  }
  res.status(201).json(booking);
}));

app.post("/api/libraries/:id/favorite", authenticate, allow("STUDENT"), asyncRoute(async (req, res) => {
  const key = { studentId_libraryId: { studentId: req.user!.id, libraryId: String(req.params.id) } };
  const existing = await prisma.favorite.findUnique({ where: key });
  if (existing) {
    await prisma.favorite.delete({ where: key });
    return res.json({ favorite: false });
  }
  await prisma.favorite.create({ data: { studentId: req.user!.id, libraryId: String(req.params.id) } });
  res.status(201).json({ favorite: true });
}));

app.get("/api/student/dashboard", authenticate, allow("STUDENT"), asyncRoute(async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const expiryLimit = new Date(today); expiryLimit.setDate(expiryLimit.getDate() + 7);
  const expiring = await prisma.studentMembership.findMany({ where: { studentId: req.user!.id, status: "ACTIVE", endDate: { gte: today, lte: expiryLimit } }, include: { library: { select: { name: true } } } });
  for (const membership of expiring) {
    const exists = await prisma.notification.findFirst({ where: { userId: req.user!.id, type: "MEMBERSHIP", entityId: membership.id } });
    if (!exists) await prisma.notification.create({ data: { userId: req.user!.id, type: "MEMBERSHIP", entityId: membership.id, actionPath: "/dashboard", title: "Membership expiring soon", message: `Your ${membership.library.name} membership expires within 7 days.` } });
  }
  const [memberships, bookings, notifications, sessions, streak, favorites, tasks, complaints, groupBookings] = await Promise.all([
    prisma.studentMembership.findMany({ where: { studentId: req.user!.id }, include: { library: true, seat: true, payments: { orderBy: { dueDate: "desc" } } } }),
    prisma.booking.findMany({ where: { studentId: req.user!.id }, include: { library: true }, orderBy: { createdAt: "desc" } }),
    prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.studySession.findMany({ where: { studentId: req.user!.id }, orderBy: { startedAt: "desc" }, take: 30 }),
    prisma.studyStreak.findUnique({ where: { studentId: req.user!.id } }),
    prisma.favorite.findMany({ where: { studentId: req.user!.id }, include: { library: { include: { images: true } } } }),
    prisma.task.findMany({ where: { studentId: req.user!.id, taskDate: { gte: today, lt: tomorrow } }, orderBy: { createdAt: "asc" } }),
    prisma.complaint.findMany({ where: { studentId: req.user!.id }, include: { library: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.groupBooking.findMany({ where: { leaderId: req.user!.id }, include: { library: { select: { name: true } }, members: true }, orderBy: { createdAt: "desc" } })
  ]);
  const libraryIds = memberships.map((item) => item.libraryId);
  const announcements = libraryIds.length ? await prisma.announcement.findMany({
    where: { libraryId: { in: libraryIds } }, include: { library: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20
  }) : [];
  res.json({ memberships, bookings, notifications, sessions, streak, favorites, tasks, complaints, groupBookings, announcements });
}));

app.get("/api/notifications", authenticate, asyncRoute(async (req, res) => {
  const notifications = await prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" }, take: 100 });
  res.json({ notifications, unreadCount: notifications.filter((item) => !item.isRead).length });
}));

app.patch("/api/notifications/:id/read", authenticate, asyncRoute(async (req, res) => {
  const notification = await prisma.notification.findFirst({ where: { id: String(req.params.id), userId: req.user!.id } });
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  res.json(await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } }));
}));

app.post("/api/notifications/read-all", authenticate, asyncRoute(async (req, res) => {
  const result = await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
  res.json({ updated: result.count });
}));

app.delete("/api/notifications/:id", authenticate, asyncRoute(async (req, res) => {
  const notification = await prisma.notification.findFirst({ where: { id: String(req.params.id), userId: req.user!.id } });
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  await prisma.notification.delete({ where: { id: notification.id } });
  res.status(204).send();
}));

app.post("/api/tasks", authenticate, allow("STUDENT"), asyncRoute(async (req, res) => {
  const data = z.object({ title: z.string().min(2).max(160), taskDate: z.coerce.date().optional() }).parse(req.body);
  const taskDate = data.taskDate ?? new Date(); taskDate.setHours(0, 0, 0, 0);
  res.status(201).json(await prisma.task.create({ data: { studentId: req.user!.id, title: data.title, taskDate } }));
}));

app.patch("/api/tasks/:id", authenticate, allow("STUDENT"), asyncRoute(async (req, res) => {
  const task = await prisma.task.findFirst({ where: { id: String(req.params.id), studentId: req.user!.id } });
  if (!task) return res.status(404).json({ message: "Task not found" });
  const data = z.object({ title: z.string().min(2).max(160).optional(), isCompleted: z.boolean().optional() }).parse(req.body);
  res.json(await prisma.task.update({ where: { id: task.id }, data }));
}));

app.delete("/api/tasks/:id", authenticate, allow("STUDENT"), asyncRoute(async (req, res) => {
  const task = await prisma.task.findFirst({ where: { id: String(req.params.id), studentId: req.user!.id } });
  if (!task) return res.status(404).json({ message: "Task not found" });
  await prisma.task.delete({ where: { id: task.id } });
  res.status(204).send();
}));

app.post("/api/complaints", authenticate, allow("STUDENT"), asyncRoute(async (req, res) => {
  const data = z.object({ libraryId: z.string(), title: z.string().min(2).max(120), category: z.string().min(2).max(80), description: z.string().min(5).max(1000) }).parse(req.body);
  const membership = await prisma.studentMembership.findFirst({ where: { studentId: req.user!.id, libraryId: data.libraryId, status: "ACTIVE" }, include: { library: true } });
  if (!membership) return res.status(403).json({ message: "An active membership is required to submit a complaint" });
  const complaint = await prisma.complaint.create({ data: { ...data, studentId: req.user!.id } });
  if (membership.library.ownerId) {
    const student = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
    await prisma.notification.create({
      data: {
        userId: membership.library.ownerId, type: "COMPLAINT", entityId: complaint.id, actionPath: "/notifications",
        title: `New complaint: ${data.title}`, message: `${student?.name ?? "A student"} reported ${data.category} at ${membership.library.name}.`
      }
    });
  }
  res.status(201).json(complaint);
}));

app.patch("/api/complaints/:id", authenticate, allow("OWNER"), asyncRoute(async (req, res) => {
  const complaint = await prisma.complaint.findUnique({ where: { id: String(req.params.id) }, include: { library: true } });
  if (!complaint || complaint.library.ownerId !== req.user!.id) return res.status(404).json({ message: "Complaint not found" });
  const data = z.object({ status: z.enum(["PENDING", "IN_REVIEW", "RESOLVED"]), ownerReply: z.string().max(1000).optional() }).parse(req.body);
  const updated = await prisma.complaint.update({ where: { id: complaint.id }, data: { ...data, resolvedAt: data.status === "RESOLVED" ? new Date() : null } });
  await prisma.notification.create({
    data: {
      userId: complaint.studentId, type: "COMPLAINT", entityId: complaint.id, actionPath: "/notifications",
      title: "Complaint updated", message: `Your complaint "${complaint.title}" is now ${data.status.toLowerCase().replace("_", " ")}.`
    }
  });
  res.json(updated);
}));

app.post("/api/group-bookings", authenticate, allow("STUDENT"), asyncRoute(async (req, res) => {
  const data = z.object({
    libraryId: z.string(), name: z.string().min(2).max(100), groupSize: z.number().int().min(2).max(20),
    planName: z.string().max(100).optional(), members: z.array(z.object({ name: z.string().min(2), email: z.string().email() })).max(19).default([])
  }).parse(req.body);
  if (data.members.length > data.groupSize - 1) return res.status(400).json({ message: "Invites exceed the selected group size" });
  const library = await prisma.library.findFirst({ where: { id: data.libraryId, status: "ACTIVE" } });
  if (!library) return res.status(404).json({ message: "Library not found" });
  const group = await prisma.groupBooking.create({
    data: {
      leaderId: req.user!.id, libraryId: data.libraryId, name: data.name, groupSize: data.groupSize, planName: data.planName,
      status: data.members.length === data.groupSize - 1 ? "PENDING" : "INVITING",
      members: { create: data.members.map((member) => ({ ...member, email: member.email.toLowerCase() })) }
    }, include: { members: true }
  });
  if (library.ownerId && group.status === "PENDING") {
    await prisma.notification.create({ data: { userId: library.ownerId, type: "BOOKING", entityId: group.id, actionPath: "/notifications", title: "New group booking", message: `${group.name} requested ${group.groupSize} nearby seats at ${library.name}.` } });
  }
  res.status(201).json(group);
}));

app.post("/api/group-bookings/:id/members", authenticate, allow("STUDENT"), asyncRoute(async (req, res) => {
  const group = await prisma.groupBooking.findFirst({ where: { id: String(req.params.id), leaderId: req.user!.id }, include: { members: true, library: true } });
  if (!group || group.status !== "INVITING") return res.status(404).json({ message: "Open group booking not found" });
  if (group.members.length >= group.groupSize - 1) return res.status(400).json({ message: "Group is already full" });
  const data = z.object({ name: z.string().min(2), email: z.string().email() }).parse(req.body);
  const member = await prisma.groupBookingMember.create({ data: { groupBookingId: group.id, name: data.name, email: data.email.toLowerCase() } });
  if (group.members.length + 1 === group.groupSize - 1) {
    await prisma.groupBooking.update({ where: { id: group.id }, data: { status: "PENDING" } });
    if (group.library.ownerId) await prisma.notification.create({ data: { userId: group.library.ownerId, type: "BOOKING", entityId: group.id, actionPath: "/notifications", title: "New group booking", message: `${group.name} requested ${group.groupSize} nearby seats at ${group.library.name}.` } });
  }
  res.status(201).json(member);
}));

app.delete("/api/group-bookings/:groupId/members/:memberId", authenticate, allow("STUDENT"), asyncRoute(async (req, res) => {
  const group = await prisma.groupBooking.findFirst({ where: { id: String(req.params.groupId), leaderId: req.user!.id } });
  if (!group || group.status !== "INVITING") return res.status(404).json({ message: "Open group booking not found" });
  const member = await prisma.groupBookingMember.findFirst({ where: { id: String(req.params.memberId), groupBookingId: group.id } });
  if (!member) return res.status(404).json({ message: "Group member not found" });
  await prisma.groupBookingMember.delete({ where: { id: member.id } });
  res.status(204).send();
}));

app.patch("/api/group-bookings/:id", authenticate, asyncRoute(async (req, res) => {
  const group = await prisma.groupBooking.findUnique({ where: { id: String(req.params.id) }, include: { library: true, members: true } });
  if (!group) return res.status(404).json({ message: "Group booking not found" });
  if (req.user!.role === "STUDENT") {
    if (group.leaderId !== req.user!.id) return res.status(403).json({ message: "Access denied" });
    const { status } = z.object({ status: z.literal("CANCELLED") }).parse(req.body);
    return res.json(await prisma.groupBooking.update({ where: { id: group.id }, data: { status } }));
  }
  if (req.user!.role !== "OWNER" || group.library.ownerId !== req.user!.id) return res.status(403).json({ message: "Access denied" });
  const { status } = z.object({ status: z.enum(["APPROVED", "REJECTED"]) }).parse(req.body);
  let seatNumbers: string[] | undefined;
  if (status === "APPROVED") {
    const seats = await prisma.seat.findMany({ where: { libraryId: group.libraryId, isAvailable: true }, orderBy: { number: "asc" } });
    for (let index = 0; index <= seats.length - group.groupSize; index++) {
      const candidate = seats.slice(index, index + group.groupSize);
      const numeric = candidate.map((seat) => Number(seat.number));
      if (numeric.every(Number.isFinite) && numeric.every((number, offset) => offset === 0 || number === numeric[offset - 1] + 1)) {
        seatNumbers = candidate.map((seat) => seat.number);
        await prisma.seat.updateMany({ where: { id: { in: candidate.map((seat) => seat.id) } }, data: { isAvailable: false } });
        break;
      }
    }
    if (!seatNumbers) return res.status(409).json({ message: "No adjacent seats are currently available for this group" });
  }
  const updated = await prisma.groupBooking.update({ where: { id: group.id }, data: { status, seatNumbers } });
  await prisma.notification.create({ data: { userId: group.leaderId, type: "BOOKING", entityId: group.id, actionPath: "/notifications", title: "Group booking updated", message: `${group.name} was ${status.toLowerCase()}${seatNumbers ? ` with seats ${seatNumbers.join(", ")}` : ""}.` } });
  res.json(updated);
}));

app.post("/api/study-sessions", authenticate, allow("STUDENT"), asyncRoute(async (req, res) => {
  const data = z.object({ durationMin: z.number().int().min(1).max(1440), mode: z.enum(["FOCUS", "POMODORO"]).default("FOCUS"), startedAt: z.coerce.date(), endedAt: z.coerce.date() }).parse(req.body);
  const session = await prisma.studySession.create({ data: { ...data, studentId: req.user!.id } });
  const day = new Date(data.endedAt); day.setHours(0, 0, 0, 0);
  const yesterday = new Date(day); yesterday.setDate(yesterday.getDate() - 1);
  const current = await prisma.studyStreak.findUnique({ where: { studentId: req.user!.id } });
  const last = current?.lastStudyDate ? new Date(current.lastStudyDate) : null;
  if (last) last.setHours(0, 0, 0, 0);
  const currentDays = last?.getTime() === day.getTime() ? current!.currentDays : last?.getTime() === yesterday.getTime() ? current!.currentDays + 1 : 1;
  const streak = await prisma.studyStreak.upsert({
    where: { studentId: req.user!.id },
    create: { studentId: req.user!.id, currentDays: 1, longestDays: 1, lastStudyDate: day },
    update: { currentDays, longestDays: Math.max(current?.longestDays ?? 0, currentDays), lastStudyDate: day }
  });
  res.status(201).json({ session, streak });
}));

app.get("/api/owner/dashboard", authenticate, allow("OWNER"), asyncRoute(async (req, res) => {
  const libraries = await prisma.library.findMany({
    where: { ownerId: req.user!.id },
    include: {
      images: true,
      bookings: { include: { student: { select: { id: true, name: true, email: true, phone: true } } }, orderBy: { createdAt: "desc" } },
      memberships: { include: { student: { select: { id: true, name: true, email: true, phone: true } }, seat: true, payments: true } },
      announcements: { orderBy: { createdAt: "desc" } },
      complaints: { include: { student: { select: { name: true, phone: true, email: true } } }, orderBy: { createdAt: "desc" } },
      groupBookings: { include: { leader: { select: { name: true, email: true, phone: true } }, members: true }, orderBy: { createdAt: "desc" } },
      _count: { select: { seats: true, memberships: true, bookings: true } }
    }
  });
  res.json({ libraries });
}));

app.patch("/api/bookings/:id", authenticate, allow("OWNER"), asyncRoute(async (req, res) => {
  const { status } = z.object({ status: z.enum(["APPROVED", "REJECTED", "WAITLISTED", "CANCELLED"]) }).parse(req.body);
  const booking = await prisma.booking.findUnique({ where: { id: String(req.params.id) }, include: { library: true, student: true } });
  if (!booking || booking.library.ownerId !== req.user!.id) return res.status(404).json({ message: "Booking not found" });
  const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status } });
  await prisma.notification.create({ data: { userId: booking.studentId, type: "BOOKING", entityId: booking.id, actionPath: "/notifications", title: "Booking updated", message: `${booking.library.name} marked your request as ${status.toLowerCase()}.` } });
  const emailStatus = status === "APPROVED" ? await sendMembershipApprovedEmail(booking.student.email, booking.student.name, booking.library.name) : undefined;
  res.json({ ...updated, emailStatus });
}));

app.post("/api/libraries/:id/memberships", authenticate, allow("OWNER"), asyncRoute(async (req, res) => {
  const library = await prisma.library.findFirst({ where: { id: String(req.params.id), ownerId: req.user!.id } });
  if (!library) return res.status(404).json({ message: "Library not found" });
  const data = z.object({
    name: z.string().min(2), email: z.string().email(), phone: z.string().min(10).max(15).optional(),
    seatNumber: z.string().optional(), monthlyFee: z.number().int().nonnegative(), startDate: z.coerce.date().default(() => new Date())
  }).parse(req.body);
  const email = data.email.toLowerCase();
  const phone = data.phone?.trim() || undefined;
  
  let student = await prisma.user.findFirst({ where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] } });
  if (student) {
    const existingMembership = await prisma.studentMembership.findUnique({
      where: { studentId_libraryId: { studentId: student.id, libraryId: library.id } }
    });
    if (existingMembership) return res.status(409).json({ message: "Student already exists." });
  }
  if (student?.role !== "STUDENT") return res.status(409).json({ message: "This email or phone belongs to a non-student account." });
  
  if (!student) {
    student = await prisma.user.create({
      data: {
        name: data.name,
        email,
        phone,
        passwordHash: await bcrypt.hash(crypto.randomUUID(), 12),
        role: "STUDENT"
      }
    });
    await sendWelcomeEmail(student.email, student.name);
  }
  
  let seat = data.seatNumber ? await prisma.seat.findUnique({ where: { libraryId_number: { libraryId: library.id, number: data.seatNumber } } }) : null;
  if (seat && !seat.isAvailable) return res.status(409).json({ message: "This seat is already assigned." });
  if (data.seatNumber && !seat) seat = await prisma.seat.create({ data: { libraryId: library.id, number: data.seatNumber } });
  let membership;
  try {
    membership = await prisma.studentMembership.create({ data: { studentId: student.id, libraryId: library.id, seatId: seat?.id, monthlyFee: data.monthlyFee, startDate: data.startDate } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ message: "Student already exists." });
    }
    throw error;
  }
  if (seat) await prisma.seat.update({ where: { id: seat.id }, data: { isAvailable: false } });
  const emailStatus = await sendMembershipApprovedEmail(student.email, student.name, library.name);
  res.status(201).json({ ...membership, emailStatus });
}));

app.post("/api/libraries/:id/import", authenticate, allow("OWNER"), upload.single("file"), asyncRoute(async (req, res) => {
  const library = await prisma.library.findFirst({ where: { id: String(req.params.id), ownerId: req.user!.id } });
  if (!library) return res.status(404).json({ message: "Library not found" });
  if (!req.file) return res.status(400).json({ message: "CSV file is required" });
  const rows = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  let imported = 0;
  for (const row of rows) {
    const name = row["Student Name"]; const phone = row["Phone"]; const seatNumber = row["Seat Number"];
    if (!name || !phone) continue;
    let student = await prisma.user.findFirst({ where: { phone } });
    if (!student) student = await prisma.user.create({ data: { name, phone, email: `${phone}@student.bookmyseat.local`, passwordHash: await bcrypt.hash(crypto.randomUUID(), 12), role: "STUDENT" } });
    if (student.role !== "STUDENT") continue;
    const existingMembership = await prisma.studentMembership.findUnique({ where: { studentId_libraryId: { studentId: student.id, libraryId: library.id } } });
    if (existingMembership) continue;
    const existingSeat = seatNumber ? await prisma.seat.findUnique({ where: { libraryId_number: { libraryId: library.id, number: seatNumber } } }) : null;
    if (existingSeat && !existingSeat.isAvailable) continue;
    let seat = seatNumber ? await prisma.seat.upsert({ where: { libraryId_number: { libraryId: library.id, number: seatNumber } }, create: { libraryId: library.id, number: seatNumber, isAvailable: false }, update: { isAvailable: false } }) : null;
    const membership = await prisma.studentMembership.create({ data: { studentId: student.id, libraryId: library.id, seatId: seat?.id, monthlyFee: 0, startDate: row["Joining Date"] ? new Date(row["Joining Date"]) : new Date() } });
    if (row["Fee Status"]) await prisma.payment.create({ data: { membershipId: membership.id, amount: 0, dueDate: new Date(), status: row["Fee Status"].toLowerCase() === "paid" ? "PAID" : "PENDING", paidAt: row["Fee Status"].toLowerCase() === "paid" ? new Date() : null } });
    imported++;
  }
  res.status(201).json({ imported, skipped: rows.length - imported });
}));

app.post("/api/libraries/:id/announcements", authenticate, allow("OWNER"), asyncRoute(async (req, res) => {
  const library = await prisma.library.findFirst({ where: { id: String(req.params.id), ownerId: req.user!.id }, include: { memberships: { where: { status: "ACTIVE" } } } });
  if (!library) return res.status(404).json({ message: "Library not found" });
  const data = z.object({ title: z.string().min(2).max(120), message: z.string().min(2).max(1000) }).parse(req.body);
  const announcement = await prisma.announcement.create({ data: { ...data, libraryId: library.id } });
  if (library.memberships.length) await prisma.notification.createMany({ data: library.memberships.map((item) => ({ userId: item.studentId, type: "ANNOUNCEMENT" as const, entityId: announcement.id, actionPath: "/announcements", title: `${library.name}: ${data.title}`, message: data.message })) });
  res.status(201).json(announcement);
}));

app.post("/api/memberships/:id/payments", authenticate, allow("OWNER"), asyncRoute(async (req, res) => {
  const membership = await prisma.studentMembership.findUnique({ where: { id: String(req.params.id) }, include: { library: true } });
  if (!membership || membership.library.ownerId !== req.user!.id) return res.status(404).json({ message: "Membership not found" });
  const data = z.object({ amount: z.number().int().nonnegative(), dueDate: z.coerce.date(), status: z.enum(["PENDING", "PAID", "OVERDUE"]), note: z.string().max(250).optional() }).parse(req.body);
  const payment = await prisma.payment.create({ data: { ...data, membershipId: membership.id, paidAt: data.status === "PAID" ? new Date() : null } });
  if (data.status !== "PAID") await prisma.notification.create({ data: { userId: membership.studentId, type: "FEE_REMINDER", entityId: payment.id, actionPath: "/notifications", title: "Fee reminder", message: `INR ${data.amount} is due for your ${membership.library.name} membership.` } });
  res.status(201).json(payment);
}));

app.post("/api/memberships/:id/attendance", authenticate, allow("OWNER"), asyncRoute(async (req, res) => {
  const membership = await prisma.studentMembership.findUnique({ where: { id: String(req.params.id) }, include: { library: true } });
  if (!membership || membership.library.ownerId !== req.user!.id) return res.status(404).json({ message: "Membership not found" });
  const data = z.object({ date: z.coerce.date(), status: z.enum(["PRESENT", "ABSENT", "HALF_DAY"]) }).parse(req.body);
  data.date.setHours(0, 0, 0, 0);
  res.status(201).json(await prisma.attendance.upsert({ where: { membershipId_date: { membershipId: membership.id, date: data.date } }, create: { ...data, membershipId: membership.id }, update: { status: data.status } }));
}));

app.get("/api/admin/dashboard", authenticate, allow("ADMIN"), asyncRoute(async (_req, res) => {
  const [users, libraries, bookings, sessions] = await Promise.all([prisma.user.count(), prisma.library.count(), prisma.booking.count(), prisma.studySession.count()]);
  res.json({
    metrics: { users, libraries, bookings, studySessions: sessions },
    libraries: await prisma.library.findMany({ include: { owner: { select: { name: true, email: true } }, _count: { select: { memberships: true } } }, orderBy: { createdAt: "desc" } }),
    users: await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 })
  });
}));

app.patch("/api/admin/users/:id/status", authenticate, allow("ADMIN"), asyncRoute(async (req, res) => {
  const { status } = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }).parse(req.body);
  res.json(await prisma.user.update({ where: { id: String(req.params.id) }, data: { status }, select: { id: true, status: true } }));
}));

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) return res.status(400).json({ message: "Validation failed", issues: error.flatten() });
  console.error(error);
  res.status(500).json({ message: "Something went wrong" });
});

app.listen(env.PORT, () => console.log(`BookMySeat API listening on http://localhost:${env.PORT}`));

export { app };
