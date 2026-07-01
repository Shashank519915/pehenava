# Pehenava Context

## Status
- **Stack**: Next.js 15, Tailwind v4, Prisma 6, NextAuth v5, Cloudflare R2 (S3 API), Neon.
- **Done**: App bootstrapped, design tokens in `globals.css`, db models & seed script (105 txns) set, Auth.js credentials login with standard route handler at `/api/auth/[...nextauth]`, Next.js 16 named proxy configuration, topbar/sidebar dashboard frame, search palette, double-entry validation, transaction entry form, filtered list views, correction review state machine with signed audit logs, separate void transaction reverses, factory-based modular storage engine, dynamic financial year context API, and print-optimized financial Reports Hub.

## Env Config Info
- `DATABASE_URL`: Connection pooler (with `-pooler` in host).
- `DATABASE_URL_DIRECT`: Direct endpoint (remove `-pooler` from host). Required for migrations.
- `STORAGE_PROVIDER`: Set to `'R2'` for production Cloudflare, or `'LOCAL'` for local dev.

## Commands
- **Migration**: `npx prisma migrate dev --name init`
- **Seed**: `npx prisma db seed`
- **Dev Server**: `npm run dev`

## Next Up
1. **POS & GST Integration**: Expand schema for barcode scan billing and automated GST returns (Phase 2 readiness).
