@AGENTS.md

# Business Management App - Varieties Cosmetics

## Project Overview
This is a **Next.js 16** business management application for "Varieties Cosmetics" (ভ্যারাইটিজ কসমেটিকস). It features an admin dashboard with authentication, user management, and business analytics.

## Tech Stack
- **Framework**: Next.js 16.2.4 (App Router)
- **Language**: TypeScript
- **UI**: React 19, Framer Motion, Lucide React icons
- **Styling**: Tailwind CSS v4
- **Database**: MongoDB via Mongoose 9
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Data**: TanStack React Query + React Table

## Key Architecture
- `app/` — Next.js App Router pages and API routes
- `app/api/auth/` — Login/Logout API routes
- `app/dashboard/` — Admin dashboard
- `lib/` — Shared utilities (MongoDB connection, auth helpers)
- `.env.local` — Environment variables (MongoDB URI, JWT secret)

## Important Notes
- Authentication uses JWT tokens stored in httpOnly cookies
- MongoDB connection string is in `.env.local`
- Admin credentials are stored securely with bcrypt hashing
- All UI text is in Bengali (বাংলা)

## For Agent Team Teammates
- Each teammate should work on separate files to avoid conflicts
- Run `npm run dev` to test changes locally
- Do NOT modify `.env.local` without team lead approval
- Follow existing code patterns and Bengali language conventions
