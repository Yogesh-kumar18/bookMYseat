# BookMySeat

**Discover. Study. Succeed.**

BookMySeat is a marketplace for students to discover study libraries and an operations platform for library owners. This repository contains a React/Vite client and an Express/Prisma API.

## Included

- Public library discovery, search, facility filters, details, pricing and direct contact
- Student and owner registration with JWT authentication and role-based access
- Booking requests, waiting lists and favorites
- Group bookings with friend invites and adjacent-seat allocation
- Owner-created public library listings and Cloudinary gallery uploads
- Student memberships, seat assignment and CSV bulk import
- Fee records, attendance, booking decisions and announcements
- Unified notification center with unread counts and owner actions
- Resend email delivery for welcome, password reset, owner registration and membership approval emails
- Complaint reporting, owner responses and resolution tracking
- Student dashboard with today's tasks, focus timer, study history and streaks
- Announcement center for membership libraries
- Admin platform metrics and account/library visibility
- Responsive light/dark interface
- Seed records for the six supplied Mathura libraries only

## Local setup

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run install:all
```

Create the environment files:

```bash
copy server\.env.example server\.env
copy frontend\.env.example frontend\.env
```

Set a strong `JWT_SECRET` in `server/.env`, then initialize SQLite:

```bash
npm run db:setup
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`

The seed is idempotent. It never creates fake images, reviews, students, bookings, or activity. An admin is created only when both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are configured.

## CSV import

Upload a UTF-8 CSV from the owner dashboard with these headers:

```csv
Student Name,Phone,Seat Number,Fee Status,Joining Date
```

Imported students receive internal account records. Owners should use the student's real email through the single-student form when the student needs direct account access.

## Cloudinary

Set these API environment variables to enable owner image uploads:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Uploads are held in memory, limited to 5 MB per image and sent directly to Cloudinary.

## Email

BookMySeat sends transactional email through Resend. Configure these API variables in `server/.env` and in Render:

```env
RESEND_API_KEY=
EMAIL_FROM="BookMySeat <noreply@bookmyseat.in>"
SUPPORT_EMAIL="support@bookmyseat.in"
```

Email is used for student/owner welcome messages, password reset links, owner registration confirmation and membership approval notices. If `RESEND_API_KEY` is missing, local development continues without sending email; production logs a configuration error for every skipped email.

## Deploy

### API on Render

1. Create a Render service from `render.yaml`.
2. Configure `CLIENT_URL` with the deployed frontend origin.
3. Configure `DATABASE_URL`.
4. Add `RESEND_API_KEY`, `EMAIL_FROM` and `SUPPORT_EMAIL` for transactional email.
5. Add Cloudinary variables when image uploads are required.

SQLite on an ephemeral filesystem is not durable. For a single Render instance, attach a persistent disk and point `DATABASE_URL` to it. For horizontal scale, switch the Prisma datasource to PostgreSQL before launch.

### Web on Vercel

1. Import the repository into Vercel.
2. The root `vercel.json` builds `frontend`.
3. Set `VITE_API_URL` to the deployed API URL ending in `/api`.

## Production checklist

- Replace all example secrets and restrict `CLIENT_URL` to deployed origins.
- Configure a durable production database and automated backups.
- Verify Resend domain authentication, sender reputation and production email logs.
- Add SMS or WhatsApp delivery for urgent reminders where owners need it.
- Configure Cloudinary upload presets and moderation.
- Add payment-provider integration before accepting online subscription payments.
- Add monitoring, structured logs, error reporting and an uptime check.
- Review privacy policy, terms, data retention and Indian payment/data regulations.

## Commands

```bash
npm run dev          # run API and web together
npm run build        # production builds
npm run db:setup     # generate client, push schema, seed real listings
```
