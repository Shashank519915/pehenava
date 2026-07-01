# PEHENAVA ACCOUNTING SOFTWARE
## Master Engineering & Design Prompt
### Production-Grade Implementation Brief — Version 2.0

---

> **Directive:** You are a Staff Software Engineer, Principal Product Designer, UX Engineer, and Product Architect operating at the level of teams that shipped Linear, Stripe Dashboard, Vercel, and Notion. You are not building a demo, a prototype, or a proof of concept. You are building a real, daily-use accounting product for a premium Indian ethnic wear showroom. Every line of code you write must be production-ready. Every design decision must be intentional. Every workflow must be complete end-to-end. No placeholders. No TODOs. No fake data that doesn't reconcile. No shortcuts.

---

## 0. BEFORE YOU WRITE A SINGLE LINE OF CODE

Produce the following architecture documents **in full** before implementation begins. Do not skip or abbreviate any of these. Each must be complete enough that a new engineer could onboard from them alone.

1. **Product Architecture** — system overview, component boundaries, data flow, external integrations
2. **Database ERD** — every entity, relationship, cardinality, and index annotated
3. **Prisma Schema** — complete, with all models, enums, relations, indexes, and soft-delete/audit fields
4. **API Specification** — every route, method, request shape, response shape, error codes, and auth requirements
5. **RBAC Matrix** — every role × every resource × every action (create / read / update / delete / export / approve)
6. **Permission Guard Map** — which middleware, server action, and component enforces which permission
7. **Folder Structure** — complete `src/` tree with one-line purpose annotation per directory and key file
8. **Feature Breakdown** — every feature decomposed to individual tasks with acceptance criteria
9. **State Management Strategy** — what lives in server state (React Query), what in URL, what in local component state, and why
10. **Caching Strategy** — what is cached, for how long, what invalidates it, stale-while-revalidate behaviour
11. **Optimistic Update Strategy** — which mutations use optimistic UI, rollback behaviour on failure
12. **Loading Strategy** — Suspense boundaries, streaming, skeleton hierarchy, progressive enhancement
13. **Animation Strategy** — which state changes animate, what easing, what duration, GPU-only rule
14. **Accessibility Strategy** — keyboard map, focus management, ARIA roles, screen reader announcements
15. **Error Handling Strategy** — error boundaries, toast taxonomy, form validation display, retry logic
16. **Audit Strategy** — what triggers an audit event, audit table schema, immutability guarantees
17. **Financial Year Isolation Strategy** — how year boundaries are enforced at DB, API, and UI layer

Only after all 17 documents are complete and internally consistent should implementation begin.

---

## 1. BUSINESS CONTEXT

**Client:** Pehenava Showroom — a premium Indian ethnic wear business.

**Purpose:** A purpose-built, internal accounting system used daily by the owner, an accountant, and optionally entry-level staff. At financial year end, the CA uses exported reports for tax filing and audit preparation.

**Core constraint:** This is not a generic accounting SaaS. Every decision — naming, workflow, hierarchy of information — must reflect the reality of a single-location Indian ethnic wear showroom that transacts in Cash, Bank Transfer/Cheque, and UPI.

**Non-negotiable quality bar:** The product must feel categorically different from Tally. It should feel like what Tally would look like if Linear designed it.

---

## 2. TECH STACK

Use the following. Do not substitute without a documented, justified reason.

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, latest stable) |
| Language | TypeScript 5 (strict mode, no `any`) |
| UI Layer | React 19 |
| Styling | Tailwind CSS v4 |
| Component Library | shadcn/ui (customised to design tokens below) |
| Animation | Framer Motion (meaningful state transitions only) |
| Micro-interactions | Motion One (hover, press, micro feedback) |
| Page Transitions | View Transitions API + Framer Motion (App Router compatible) |
| Smooth Scroll | Lenis |
| Server State | TanStack Query v5 |
| Schema Validation | Zod v3 |
| Forms | React Hook Form + Zod resolver |
| ORM | Prisma 6 |
| Database | Neon PostgreSQL (serverless, connection pooling via Prisma Accelerate) |
| Auth | Auth.js v5 (NextAuth) |
| File Storage | UploadThing (invoices, bills, receipts, bank slips, screenshots) |
| Charts | Recharts |
| Date handling | Day.js with timezone plugin |
| Testing | Vitest (unit/integration) + Playwright (E2E) |
| Code Quality | ESLint + Prettier + Husky + lint-staged |
| CI/CD | GitHub Actions |
| Containerisation | Docker + docker-compose for local dev |

**Server Actions** are preferred over Route Handlers wherever the operation is mutation-bound and does not require streaming or webhook reception. Use Route Handlers for: report PDF generation, file download endpoints, webhook ingestion, and any endpoint consumed by a non-browser client.

---

## 3. DESIGN SYSTEM & VISUAL IDENTITY

### 3.1 Brand Personality

The product serves a luxury Indian ethnic wear showroom. The software must carry that DNA. It should feel:

- **Luxury** — unhurried, confident, nothing cheap
- **Handcrafted** — warm, human, not clinical
- **Earthy & Ethnic** — rooted in Indian aesthetic tradition, not a Western SaaS clone
- **Premium** — as if Stripe Dashboard hired a craftsperson from Jaipur
- **Minimal** — every element earns its place
- **Timeless** — will not feel dated in five years

The reference set is: **Linear × Stripe Dashboard × Apple Settings**, with warm ivory grounds and subtle floral ornamentation borrowed from the Pehenava logo language.

**Explicitly not:** Tally. Generic SaaS blue. Clinical white with grey. Bootstrap tables.

### 3.2 Design Tokens

Apply these tokens consistently. Do not override them inline. All custom Tailwind utilities must map back to these variables.

```css
:root {
  /* ── Brand Palette ──────────────────────────────── */
  --brand-50:  #F8F3EF;
  --brand-100: #F1E6DE;
  --brand-200: #E5CDBD;
  --brand-300: #D8B39B;
  --brand-400: #C8936F;
  --brand-500: #B6764F;
  --brand-600: #A86545;
  --brand-700: #8D5342;
  --brand-800: #6B433D;
  --brand-900: #4C2E2A;

  /* ── Accent ─────────────────────────────────────── */
  --accent:       #D18A55;
  --accent-light: #E8B78E;
  --accent-dark:  #A75E38;

  /* ── Surface & Background ───────────────────────── */
  --background:  #FAF8F5;   /* warm ivory — app ground */
  --surface:     #FFFFFF;   /* cards, modals, panels */
  --surface-alt: #F5F1EC;   /* table rows, alternate bands */

  /* ── Text ───────────────────────────────────────── */
  --text-primary:   #2F2927;
  --text-secondary: #6B625E;
  --text-muted:     #A79C95;

  /* ── Border ─────────────────────────────────────── */
  --border: #E7DED5;

  /* ── Gradients ──────────────────────────────────── */
  --gradient-brand: linear-gradient(135deg, #6B433D 0%, #8D5342 50%, #D18A55 100%);
  --gradient-light: linear-gradient(180deg, #FAF8F5, #F2ECE5);
  --gradient-hero:  radial-gradient(circle at top, #EFD8C6, #FAF8F5);

  /* ── Shadows ────────────────────────────────────── */
  --shadow-soft:   0 4px  16px rgba(107, 67, 61, 0.08);
  --shadow-medium: 0 10px 30px rgba(107, 67, 61, 0.12);
  --shadow-large:  0 20px 60px rgba(107, 67, 61, 0.18);

  /* ── Border Radius ──────────────────────────────── */
  --radius-xs:   8px;
  --radius-sm:   12px;
  --radius-md:   18px;
  --radius-lg:   24px;
  --radius-xl:   36px;
  --radius-full: 999px;

  /* ── Spacing scale (px) ─────────────────────────── */
  /* 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160 */
}
```

### 3.3 Typography

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display | Cormorant Garamond | 300, 500, 600, 700 | Hero headlines, empty states, large numerics |
| Heading | Playfair Display | 400, 700 | Section titles, card headers, modal titles |
| Body | Inter | 400, 500, 600 | All UI copy, labels, form fields, tables |

**Type Scale:**

| Token | Size | Usage |
|---|---|---|
| `display-xl` | 72px | Hero headline |
| `display-l` | 56px | Marketing sections |
| `h1` | 48px | Page titles |
| `h2` | 38px | Section headings |
| `h3` | 30px | Card/panel titles |
| `h4` | 24px | Sub-headings |
| `body-lg` | 20px | Lead copy |
| `body` | 18px | Default body |
| `body-sm` | 16px | Secondary copy |
| `caption` | 14px | Labels, metadata, timestamps |

### 3.4 Component Tokens

**Buttons:**
- **Primary** — bg `#6B433D`, text white, radius `999px`, padding `16px 32px`, hover bg `#D18A55`, shadow medium
- **Secondary** — transparent bg, border `1px solid #6B433D`, text `#6B433D`
- **Luxury/Copper** — gradient-brand background, white text, subtle gold border
- **Destructive** — use Tailwind `destructive` mapped to a deep red; never use the same red as a warning
- **Ghost** — no border, no bg, text secondary; for low-emphasis actions in dense UIs
- All buttons must have: `:hover` (lift 2px, shadow-medium), `:active` (compress scale 0.97), `:focus-visible` (3px copper ring), `:disabled` (50% opacity, no cursor pointer)

**Cards:**
- bg `var(--surface)`, border-radius `24px`, padding `32px`, border `1px solid #ECE2D7`, shadow soft
- Hover: lift `translateY(-4px)`, shadow medium, transition 200ms ease

**Inputs & Form Fields:**
- bg `var(--surface)`, border `1px solid var(--border)`, radius `12px`, padding `12px 16px`
- Focus: border `var(--accent)`, ring `0 0 0 3px rgba(209,138,85,0.15)`
- Error: border red, ring red-tinted, error message in caption below
- Never use placeholder text as a label substitute — all fields have floating or stacked labels

**Icons:** Lucide React, 24px, stroke-width 1.5, color `var(--accent)` for primary actions, `var(--text-muted)` for decorative

**Tables:**
- Alternating row bg: `var(--surface)` / `var(--surface-alt)`
- Header: Playfair Display, caption size, uppercase tracking, `var(--text-secondary)`
- Sticky header when table is scrollable
- All numeric columns right-aligned, formatted with Indian number system (₹ symbol, lakhs/crores)

**Decorative elements** (use sparingly, never in the application shell — only on landing and empty states):
- Thin copper dividers
- Floral circular motifs inspired by the Pehenava logo
- Soft watercolour paper texture as subtle background pattern
- Hand-drawn curved ornamental lines

### 3.5 Animation Rules

These are laws, not guidelines:

1. **Animate only meaningful state changes.** Loading → loaded. Empty → filled. Pending → approved. Not hover → hover.
2. **Default duration: 200–250ms.** Nothing slower except deliberate narrative moments (page entry: 350ms max).
3. **GPU transforms only.** `transform`, `opacity`. Never `height`, `width`, `top`, `margin` in animations.
4. **Easing:** `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for state toggles.
5. **No bounce.** No spring with visible overshoot. No rubber-band.
6. **Respect `prefers-reduced-motion`.** All animations wrap in a check; if reduced motion, snap instantly.
7. **Never animate layout.** No `AnimatePresence` on list items unless the list is ≤ 10 items.
8. **Stagger groups only when ≤ 5 items.** Stagger delay: 40ms per item max.
9. **Page transitions:** fade + subtle translateY(8px). Duration 250ms. Never block navigation.
10. **Hover interactions:** buttons compress to `scale(0.97)`, cards lift `translateY(-4px)`. Both 150ms.

---

## 4. APPLICATION ARCHITECTURE

### 4.1 Two Distinct Experiences

The application has two clearly separated experiences that share an auth layer but have distinct shells:

**A. Marketing / Landing Site** (`/`)
A brand-quality landing page that earns trust before sign-in. Not an afterthought. Not a placeholder.

Required sections (in order):
- **Hero** — warm ivory ground, large serif headline, copper CTA, floating motif background, product screenshot
- **Brand Story** — who Pehenava is, why this software was built
- **Why Pehenava Accounting** — 3–4 differentiating points vs. generic tools
- **Features Overview** — illustrated feature cards
- **Accounting Workflow** — step-by-step visual showing how a transaction flows through the system
- **Screenshots / UI Preview** — honest, real UI previews (not marketing mockups)
- **Testimonials** — placeholder-ready component structure with real data slots
- **FAQ** — at least 8 real questions a showroom owner would ask
- **Contact** — simple form
- **Footer** — brand, nav, legal

**B. Application Shell** (`/dashboard`, `/transactions`, `/reports`, etc.)
Enters via a seamless page transition from the marketing site post-login. Has its own navigation, layout, and shell components. Never mixes marketing aesthetics with app density.

Application shell must have:
- Persistent sidebar (collapsible on tablet, drawer on mobile)
- Top bar with: global search trigger, financial year selector, notification bell, user menu
- Breadcrumb trail on all pages
- Keyboard shortcut system (⌘K for command palette, ⌘N for new transaction, etc.)
- Command palette (cmdk or equivalent) as the primary power-user navigation

### 4.2 URL Structure

```
/                           → Landing
/auth/login                 → Sign in
/auth/forgot-password       → Password reset
/dashboard                  → Main dashboard
/transactions               → Transaction list
/transactions/new           → New transaction form
/transactions/[id]          → Transaction detail + history
/transactions/[id]/edit     → Edit (redirects to correction request if locked)
/accounts                   → Chart of accounts
/accounts/[id]              → Account ledger
/customers                  → Customer directory
/customers/[id]             → Customer ledger + outstanding
/suppliers                  → Supplier directory
/suppliers/[id]             → Supplier ledger + outstanding
/reports                    → Report hub
/reports/[slug]             → Individual report viewer
/corrections                → Correction request queue
/corrections/[id]           → Correction detail + review
/admin                      → Admin portal (role-gated)
/admin/users                → User management
/admin/roles                → Permission matrix
/admin/audit                → Audit log
/admin/financial-years      → Financial year management
/admin/accounts             → Master chart of accounts
/settings                   → Personal settings
```

---

## 5. CORE FUNCTIONAL REQUIREMENTS

### 5.1 Transaction Recording

Every transaction entry must capture:

| Field | Type | Constraint |
|---|---|---|
| Transaction Type | Enum | SALE, PURCHASE, EXPENSE, INCOME, RECEIPT, PAYMENT |
| Date | Date | Cannot be in a closed financial year |
| Amount | Decimal(15,2) | Positive, validated |
| Payment Mode | Enum | CASH, BANK, UPI |
| Account | FK → Account | From chart of accounts |
| Party | FK → Customer or Supplier | Optional for non-party transactions |
| Description | Text | Required, 3–500 chars |
| Reference Number | String | Optional (cheque no., UPI ref, etc.) |
| Attachments | File[] | Optional, ≤10 files per transaction |
| Financial Year | FK → FinancialYear | Auto-assigned, cannot be changed after creation |
| Created By | FK → User | System-assigned |
| Status | Enum | DRAFT, POSTED, CORRECTION_REQUESTED, CORRECTED, VOIDED |

**Ledger posting** must be automatic and immediate upon saving a POSTED transaction. No manual posting step.

**Double-entry accounting enforcement:** Every transaction must produce balanced debit/credit journal entries. The system must refuse to save if the journal does not balance. Implement a `validateJournalBalance()` function that runs as a server-side guard on every transaction save.

**Indian number formatting:** All currency values displayed in the Indian system (lakhs, crores). Use a shared `formatINR(amount: number): string` utility throughout. Never raw `.toLocaleString()` without this wrapper.

### 5.2 Supported Transaction Types (per SRD)

| # | Type | Debit | Credit |
|---|---|---|---|
| 01 | Sale | Customer A/c or Cash/Bank/UPI | Sales A/c |
| 02 | Purchase | Purchases A/c | Supplier A/c or Cash/Bank/UPI |
| 03 | Expense | Expense A/c | Cash/Bank/UPI |
| 04 | Income | Cash/Bank/UPI | Income A/c |
| 05 | Receipt (from customer) | Cash/Bank/UPI | Customer A/c |
| 06 | Payment (to supplier) | Supplier A/c | Cash/Bank/UPI |

### 5.3 Chart of Accounts — Seed Data

Pre-configure exactly these accounts on database seed. All are soft-deletable but not hard-deletable.

| # | Account Name | Type | Normal Balance |
|---|---|---|---|
| 01 | Sales A/c | Revenue | Credit |
| 02 | Purchases A/c | Cost of Goods | Debit |
| 03 | Cash A/c | Asset | Debit |
| 04 | Bank A/c | Asset | Debit |
| 05 | UPI A/c | Asset | Debit |
| 06 | Rent Expense A/c | Expense | Debit |
| 07 | Electricity Expense A/c | Expense | Debit |
| 08 | Salary Expense A/c | Expense | Debit |
| 09 | Customer A/c (default) | Asset – Debtors | Debit |
| 10 | Supplier A/c (default) | Liability – Creditors | Credit |

Admin can add new accounts. Account type determines which side of the journal it appears on — this must be enforced, not merely suggested.

### 5.4 Payment Mode — Mandatory Field

Every single transaction must have a payment mode selected. The UI must not allow form submission without this field. The three modes are:
- **Cash** — posts to Cash A/c
- **Bank Transfer / Cheque** — posts to Bank A/c
- **UPI** — posts to UPI A/c

This field also drives which of the three books (Cash Book, Bank Book, UPI Book) the transaction appears in.

### 5.5 Attachment System

File attachments are optional but, when provided, must be:
- Stored via UploadThing with a stable, permanent URL
- Linked to the transaction record in the DB (one-to-many)
- Previewable inline (PDF preview, image preview)
- Downloadable individually
- Soft-deletable (never hard-delete)
- Virus-scan-ready: implement an abstract `scanFile(url: string): Promise<ScanResult>` interface so a real scanner can be plugged in later without schema changes
- Versioned: if an attachment is replaced during a correction, the old version is preserved

Accepted types: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.heic` (auto-converted), `.csv`, `.xlsx`

Max file size: 10MB per file, 50MB per transaction total.

### 5.6 Financial Year Management

A financial year in India runs **1 April → 31 March**.

Requirements:
- Financial years are admin-created (e.g., FY 2024-25, FY 2025-26)
- Exactly one year is "active" at a time — all new transactions default to the active year
- Opening balances must be set for each account at year start
- Closing balances are auto-calculated from opening + net movement
- Year can be "closed" — after closure, no new transactions can be posted to it
- Correction requests for closed-year transactions require admin approval with documented reason
- Switching the year view must be instant — use a `FinancialYearContext` that wraps the app shell
- Reports always scope to the selected year unless explicitly set to "All years" (admin only)
- **Data from one year must never leak into another year's reports or balances**

### 5.7 Reports — Complete Specification

All reports must support: date range filter (within active/selected year), export to PDF, export to Excel (.xlsx), export to CSV.

**Financial Books:**

| Report | Key Fields |
|---|---|
| **Sales Report** | Date, Customer, Description, Payment Mode, Amount, Running Total |
| **Purchase Report** | Date, Supplier, Description, Payment Mode, Amount, Running Total |
| **Cash Book** | Date, Description, Debit, Credit, Balance |
| **Bank Book** | Date, Description, Ref No., Debit, Credit, Balance |
| **UPI Book** | Date, Description, UPI Ref, Debit, Credit, Balance |
| **Day Book** | All transactions chronologically, all payment modes |
| **Ledger Report** | Per-account: Date, Particulars, Debit, Credit, Balance |

**Management Reports:**

| Report | Key Fields |
|---|---|
| **Customer Outstanding** | Customer, Total Invoiced, Total Received, Balance Due, Ageing (30/60/90+ days) |
| **Supplier Outstanding** | Supplier, Total Billed, Total Paid, Balance Due, Ageing |
| **Profit & Loss** | Revenue accounts - Expense accounts = Net Profit/Loss, period comparison |
| **Balance Sheet** | Assets = Liabilities + Equity, formatted per Indian accounting standards |
| **GST Summary** | Taxable value, GST rate buckets, Input Tax, Output Tax, Net GST payable (future-proof even if GST is not yet collected) |
| **Trial Balance** | All accounts, Opening, Debit Total, Credit Total, Closing, should balance |
| **Financial Year Report** | Full year P&L + Balance Sheet + Cash Flow summary |

**Report UX requirements:**
- Reports open in a full-screen "report viewer" experience, not a modal
- Print-optimised CSS (`@media print`) for all reports — what you see is what you print
- PDF generation uses a server-side route that renders the report and returns a binary PDF (use Puppeteer or `@react-pdf/renderer` — choose one and justify)
- Large reports (>500 rows) must paginate — cursor pagination, 100 rows per page
- Report viewer must have a column visibility toggle
- Numbers in reports must be auditable — clicking a line item navigates to the source transaction

### 5.8 Dashboard

The dashboard is the most-visited screen. It must load instantly (streaming + Suspense) and communicate financial health at a glance.

**Required cards/widgets:**

| Widget | Data | Interaction |
|---|---|---|
| Today's Sales | Sum of today's SALE transactions | Click → Sales Report filtered to today |
| Today's Purchases | Sum of today's PURCHASE transactions | Click → Purchase Report filtered to today |
| Cash Balance | Current Cash A/c balance | Click → Cash Book |
| Bank Balance | Current Bank A/c balance | Click → Bank Book |
| UPI Balance | Current UPI A/c balance | Click → UPI Book |
| Outstanding Receivables | Sum of open customer balances | Click → Customer Outstanding Report |
| Outstanding Payables | Sum of open supplier balances | Click → Supplier Outstanding Report |
| Monthly Profit | Revenue - Expenses for current month | Click → P&L for current month |
| Recent Transactions | Last 10 transactions across all types | Click row → Transaction detail |
| Pending Corrections | Count of CORRECTION_REQUESTED transactions | Click → Correction queue |
| Pending Approvals | Count of transactions awaiting admin approval | Click → Approval queue |

**Charts (Recharts):**
- Monthly revenue vs expenses (bar chart, current FY)
- Cash/Bank/UPI balance trend (area chart, last 30 days)
- Payment mode split (donut chart, current month)

All chart data must be real, computed server-side. No mocked data on the dashboard.

### 5.9 Search & Filters

**Global Search** (⌘K):
- Searches across: transactions, customers, suppliers, accounts, reports, users (admin only)
- Fuzzy matching using PostgreSQL `pg_trgm` extension or equivalent
- Results grouped by type with keyboard navigation
- Debounced at 300ms, minimum 2 characters

**Transaction List Filters:**
- Date range (calendar picker, presets: Today, This Week, This Month, This Quarter, This Year, Custom)
- Transaction type (multi-select)
- Payment mode (multi-select)
- Account (multi-select, searchable)
- Customer / Supplier (typeahead)
- Amount range (min/max)
- Status (multi-select)
- Created by (admin only, multi-select)

**Saved Filters:** Users can save filter combinations with a name. Saved filters appear as quick-access chips above the filter bar.

---

## 6. AUTHENTICATION & RBAC

### 6.1 Authentication

Auth.js v5 with the following providers:
- **Credentials** (email + password) — primary
- Magic link (email OTP) — optional second factor, implement the infrastructure even if not immediately surfaced in UI

Password requirements: min 12 chars, at least 1 uppercase, 1 number, 1 special char. Bcrypt with cost factor 12.

Session strategy: JWT with 7-day expiry, refreshed on activity. Store session metadata (IP, user agent, device fingerprint) in a `Session` table for admin visibility.

Failed login attempts: lock account after 5 consecutive failures within 15 minutes. Admin can unlock. Log every attempt.

### 6.2 RBAC Matrix

| Permission | Admin | Accountant | Maintainer | Employee | Read Only |
|---|---|---|---|---|---|
| Create transactions | ✅ | ✅ | ✅ | ✅ (sales only) | ❌ |
| View all transactions | ✅ | ✅ | ✅ | Own only | ✅ |
| Edit transaction (via correction) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve correction requests | ✅ | ❌ | ❌ | ❌ | ❌ |
| Void transactions | ✅ | ❌ | ❌ | ❌ | ❌ |
| View all reports | ✅ | ✅ | ✅ | ❌ | ✅ |
| Export reports | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage chart of accounts | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage customers/suppliers | ✅ | ✅ | ✅ | ❌ | ❌ |
| View dashboard | ✅ | ✅ | ✅ | Limited | Limited |
| Manage users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage financial years | ✅ | ❌ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ | ❌ | ❌ |

Permissions must be enforced at **three layers**:
1. **Middleware** — `middleware.ts` checks session and role before page renders
2. **Server Action / Route Handler** — every mutation re-validates permission from the session, never trusts the client
3. **UI** — hide or disable controls the user cannot use; never rely on this as the security layer

### 6.3 User Management (Admin Portal)

Admin must be able to:
- Create new users (name, email, role, temporary password)
- Deactivate users (soft disable — not delete; historical records remain attributed to them)
- Reset passwords (generates a one-time reset link, valid 24h)
- Assign and change roles
- View per-user activity: last login, failed attempts, active sessions, device history, IP history
- Force-logout a specific session or all sessions for a user
- View a user's complete audit trail

---

## 7. RECTIFICATION & CORRECTION WORKFLOW

**Core principle:** Accounting records are never silently edited. The system must behave like double-entry bookkeeping combined with Git history — every change is traceable.

### 7.1 Correction Request Flow

```
Transaction posted (Status: POSTED)
    ↓
User finds error
    ↓
User submits Correction Request:
  - Mandatory: reason for correction (min 20 chars)
  - Required: proposed new values (only changed fields)
  - Optional: supporting attachment
  - Preserved: original transaction snapshot (immutable)
    ↓
Transaction status → CORRECTION_REQUESTED
    ↓
Admin notified (in-app notification + email if configured)
    ↓
Admin opens Correction Review screen:
  - Side-by-side diff view: Original vs Proposed
  - Reason stated by requester
  - Supporting document preview
    ↓
    ├── APPROVE:
    │     New transaction version created
    │     Original version archived (status: SUPERSEDED)
    │     Ledger re-posted with corrected values
    │     Audit entry created with full before/after
    │     Requester notified
    │
    └── REJECT:
          Reason required
          Transaction status → POSTED (restored)
          Requester notified with rejection reason
```

**Version chain:** A transaction can have multiple versions. The UI shows the current version by default, with a "Version history" toggle that reveals the full chain, each with its corrector, timestamp, and diff.

**Voiding:** Only Admin can void a transaction. Voiding requires a reason. A void creates a reversing journal entry — it does not delete the original. Both the original and the reversal appear in ledgers, netting to zero.

---

## 8. AUDIT TRAIL

Every system event that mutates state must produce an immutable audit record. The `AuditLog` table must never be writable by the application layer after insert — use a PostgreSQL trigger or a separate append-only write path.

### 8.1 Audit Log Schema

```
AuditLog {
  id              String    @id (ULID — sortable, time-prefixed)
  eventType       Enum      (see event taxonomy below)
  entityType      String    ("Transaction" | "User" | "Account" | etc.)
  entityId        String
  actorId         String    FK → User
  actorRole       String    (snapshot of role at time of event)
  ipAddress       String
  userAgent       String
  deviceFingerprint String
  sessionId       String
  before          Json?     (previous state snapshot)
  after           Json?     (new state snapshot)
  reason          String?   (required for corrections, voids, year closes)
  timestamp       DateTime  @default(now()) @db.Timestamptz
  immutableHash   String    (SHA-256 of the record content — tamper detection)
}
```

### 8.2 Audit Event Taxonomy

```
AUTH:    LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, PASSWORD_RESET, SESSION_REVOKED
USER:    USER_CREATED, USER_UPDATED, USER_DEACTIVATED, ROLE_CHANGED
TXN:     TRANSACTION_CREATED, TRANSACTION_CORRECTION_REQUESTED,
         TRANSACTION_CORRECTION_APPROVED, TRANSACTION_CORRECTION_REJECTED,
         TRANSACTION_VOIDED, TRANSACTION_EXPORTED
REPORT:  REPORT_VIEWED, REPORT_EXPORTED
YEAR:    FINANCIAL_YEAR_CREATED, FINANCIAL_YEAR_OPENED, FINANCIAL_YEAR_CLOSED
ACCOUNT: ACCOUNT_CREATED, ACCOUNT_UPDATED, ACCOUNT_DEACTIVATED
SYSTEM:  SETTINGS_CHANGED, BACKUP_INITIATED, PERMISSION_CHANGED
```

### 8.3 Audit Viewer (Admin Only)

- Full-screen audit log table, read-only
- Filters: date range, event type, actor, entity type, entity id
- Each row expandable to show full `before` / `after` JSON diff, rendered as a human-readable diff
- Export to CSV (admin only)
- The immutable hash column is visible — admin can manually verify integrity

---

## 9. ADMIN PORTAL

The admin portal (`/admin/*`) is a distinct sub-application within the same Next.js app. It has the same visual language but a denser, more information-heavy layout suited to administration tasks.

Sections:
- **Overview Dashboard** — system health, active users, transaction volume, pending items
- **Users** — full user management (§6.3)
- **Roles & Permissions** — visual permission matrix editor
- **Correction Requests** — queue of all pending corrections across all users, with bulk approve/reject
- **Audit Logs** — full audit log viewer (§8.3)
- **Financial Years** — create, open, close, view year-by-year summaries
- **Chart of Accounts** — master account management
- **System Settings** — app name, timezone, currency display preferences
- **Data Export** — full database export for CA (structured JSON + CSV bundle)

---

## 10. STATE MANAGEMENT ARCHITECTURE

### 10.1 Server State (TanStack Query)

All data fetched from the server lives in TanStack Query. Keys must follow a consistent hierarchy:

```typescript
// Convention: ['entity', 'operation', ...params]
['transactions', 'list', { financialYearId, filters, page }]
['transactions', 'detail', transactionId]
['accounts', 'list']
['accounts', 'detail', accountId]
['accounts', 'ledger', accountId, { dateRange }]
['reports', slug, { dateRange, financialYearId }]
['dashboard', 'summary', financialYearId]
['corrections', 'list', { status }]
['audit', 'list', { filters }]
['users', 'list']
```

### 10.2 URL State (nuqs or next/navigation)

Filters, sort order, pagination, and active tab belong in the URL. Use `nuqs` for type-safe URL state. This ensures:
- Filters survive page reload
- Filtered views are shareable by URL
- Back button works correctly on filtered views

### 10.3 UI State (React useState / useReducer)

Only for:
- Controlled form inputs (via React Hook Form)
- Modal open/close
- Sidebar collapsed/expanded
- Command palette open/close
- Toast queue (via sonner or Radix Toast)

### 10.4 Global App State (React Context)

Keep context minimal. Only two contexts are justified:
- `FinancialYearContext` — active financial year, year list, switch function
- `UserContext` — current user's profile, role, permissions (derived from session)

---

## 11. LOADING, SKELETON & EMPTY STATES

### 11.1 Every page must have a defined skeleton

Skeletons must anatomically mirror the loaded content — not generic pulsing bars. A transaction list skeleton shows fake table rows with the right column proportions. A dashboard skeleton shows the right card shapes in the right grid.

### 11.2 Empty States

Every list, table, and report that can return zero results must have an empty state. Empty states must:
- Explain what would normally appear here
- Tell the user what action will make this non-empty
- Provide a CTA to take that action (if the user has permission)
- Be visually considered — use the Pehenava decorative motif language, not a generic cloud icon

### 11.3 Error States

Every data-fetching component must have an error state. Use React Query's `isError` + `error` states. Error messages must be:
- Human-readable (not stack traces)
- Actionable (tell the user what to do)
- Consistent in voice (implement a `getErrorMessage(error: unknown): string` utility)
- Include a retry button where a retry is meaningful

### 11.4 Permission Denied States

When a user navigates to a page they cannot access, show a bespoke "permission denied" screen — not a generic 403. It should explain which role can access it and offer a navigation back.

---

## 12. PERFORMANCE TARGETS

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 95 |
| Lighthouse Accessibility | ≥ 95 |
| Lighthouse Best Practices | ≥ 95 |
| Lighthouse SEO (landing) | ≥ 95 |
| Core Web Vitals LCP | < 2.5s |
| Core Web Vitals CLS | < 0.1 |
| Core Web Vitals INP | < 200ms |
| Time to First Dashboard Render | < 1.2s on 4G |

**Techniques to employ:**
- All dashboard data fetched with parallel server-side queries (use `Promise.all`)
- Landing page images: Next.js `<Image>` with `priority` on hero, lazy on all others
- Fonts: `next/font` with `display: swap` and `preload: true`
- Route segments: `loading.tsx` for every segment that fetches data
- Heavy report pages: lazy import the chart components
- No client components that are not necessary — prefer Server Components by default
- Database: add `pg_trgm` extension for search, add indexes on all FK columns, all filter columns, and all sort columns

---

## 13. ACCESSIBILITY

- All interactive elements reachable by keyboard
- Logical tab order on every form
- Focus trap in modals and drawers
- `aria-live` regions for toast notifications and async feedback
- All form inputs have associated `<label>` elements (not just `placeholder`)
- All icons have `aria-label` or `aria-hidden` with adjacent visible text
- All images have meaningful `alt` text
- Color contrast: all text meets WCAG AA minimum (4.5:1 for body, 3:1 for large text)
- The design tokens provide sufficient contrast — verify programmatically in tests
- `prefers-reduced-motion` respected for all animations
- Screen reader announcements for: transaction saved, correction submitted, approval granted, year switched

---

## 14. TESTING

### 14.1 Unit & Integration (Vitest)

Required test coverage:
- All currency formatting utilities
- `validateJournalBalance()` — at least 20 test cases covering edge cases
- All Zod schemas
- All RBAC permission checks
- Report calculation functions (totals, balances, running sums)
- Financial year boundary enforcement
- Correction request state machine transitions

### 14.2 E2E (Playwright)

Required E2E scenarios:
- Full transaction lifecycle: create → view → submit correction → approve correction → verify ledger updated
- Financial year switch: create transaction in FY-A, switch to FY-B, verify it does not appear in FY-B reports
- RBAC: Employee cannot access admin routes, Accountant cannot approve corrections
- Report generation: generate each report type, verify data accuracy against known seed data, export to PDF
- Authentication: login, failed login lockout, password reset flow
- Audit trail: every E2E action verifies a corresponding audit record was created

### 14.3 Test Data

Provide a comprehensive seed script that creates:
- 1 Admin, 1 Accountant, 1 Maintainer, 1 Employee, 1 Read Only user
- 2 financial years (FY 2024-25 complete with closing balances, FY 2025-26 active)
- At least 100 realistic transactions across all types, payment modes, and accounts
- 5 customers with varying outstanding balances
- 5 suppliers with varying outstanding balances
- 3 pending correction requests in various states
- Full audit log entries for all seeded events

---

## 15. SECURITY CHECKLIST

Implement all of the following. Do not mark this section complete until every item is verifiable:

- [ ] All mutations require authenticated session (middleware + server-side re-check)
- [ ] CSRF protection via Auth.js tokens on all forms
- [ ] All user input sanitised before database write
- [ ] Parameterised queries only (Prisma enforces this — never raw SQL with interpolation)
- [ ] File uploads: validate MIME type server-side (not just extension), enforce size limits
- [ ] Rate limiting on: auth endpoints (10 req/min), API routes (100 req/min per user)
- [ ] Security headers via `next.config.ts`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`
- [ ] Secrets in environment variables only — never hardcoded, never committed
- [ ] Audit log append-only enforcement (PostgreSQL row-level security or trigger)
- [ ] Session invalidation on role change or account deactivation
- [ ] No sensitive data in client-side bundle (no API keys, no DB credentials)
- [ ] Attachment URLs are signed/expiring — not publicly guessable permanent URLs

---

## 16. ENVIRONMENT & DEPLOYMENT

### 16.1 Required Environment Variables

```bash
# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Database
DATABASE_URL=           # Neon connection string (pooled)
DATABASE_URL_DIRECT=    # Neon direct connection (for migrations)

# UploadThing
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=

# Email (for password reset, notifications)
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

### 16.2 Docker

Provide a `docker-compose.yml` for local development that includes:
- Next.js app service
- Local PostgreSQL service (for offline dev without Neon)
- Automatic `prisma migrate dev` on container start

### 16.3 CI/CD (GitHub Actions)

Pipeline must include:
- `lint` — ESLint + TypeScript type-check
- `test:unit` — Vitest
- `test:e2e` — Playwright (against a seeded local DB)
- `build` — `next build` must succeed
- `migrate` — `prisma migrate deploy` on merge to main (preview env)
- Deploy to Vercel on merge to main

### 16.4 README

The README must include:
- Project overview
- Local development setup (step-by-step, from clone to running app in < 10 commands)
- Environment variable documentation
- Database setup and seeding
- Testing guide
- Deployment guide
- Architecture decision log (key choices and their rationale)
- Migration guide

---

## 17. PHASE 2 ARCHITECTURE READINESS

The following features are **out of scope for Phase 1** but the architecture must accommodate them without breaking changes. Design schemas, API contracts, and component boundaries so these can be added later:

| Feature | Architectural Consideration |
|---|---|
| GST Invoice Generation | `Transaction` model should have a nullable `gstDetails` JSON field reserved |
| Barcode Billing / POS | `Product` and `Inventory` models should be addable without altering `Transaction` |
| WhatsApp Invoice Sharing | Notification service should be abstracted behind an interface |
| SMS Payment Reminders | Same notification interface |
| Backup & Restore | DB export endpoint should exist but be admin-only, outputting full relational dump |
| Cloud Sync / Multi-device | Stateless server design (no in-memory state) — already required by serverless deployment |
| Mobile App | All functionality exposed via documented API routes, not just server actions |

---

## 18. DELIVERABLES CHECKLIST

The following must all be present in the final output. Nothing is optional.

**Architecture:**
- [ ] Complete Prisma schema (all models, relations, indexes)
- [ ] ERD diagram
- [ ] API specification
- [ ] RBAC matrix
- [ ] Folder structure with annotations

**Implementation:**
- [ ] Landing / marketing site (all sections)
- [ ] Auth flows (login, logout, password reset, session management)
- [ ] Dashboard with real computed data
- [ ] Transaction management (list, create, detail, correction workflow)
- [ ] Chart of accounts management
- [ ] Customer & supplier management with ledgers
- [ ] All 13 reports with export (PDF, Excel, CSV)
- [ ] Financial year management and switching
- [ ] Attachment system
- [ ] Global search with command palette
- [ ] Admin portal (users, roles, corrections, audit, financial years, accounts)
- [ ] Notification system (in-app)
- [ ] User settings page

**Quality:**
- [ ] Seed script with realistic demo data
- [ ] Vitest test suite
- [ ] Playwright E2E suite
- [ ] README
- [ ] Deployment guide
- [ ] Docker compose
- [ ] GitHub Actions CI/CD
- [ ] Environment variable documentation
- [ ] Security checklist (every item verified)
- [ ] Performance checklist (Lighthouse scores documented)

---

## 19. FINAL QUALITY STANDARD

Ship this as if it will become a commercial accounting product used by hundreds of Indian showrooms.

Every screen should feel as if a craftsperson made it. The warmth of the brand must be present in every interaction — from the hover state on a table row to the empty state illustration on a report with no data. The software must make the owner of Pehenava proud to show it to their CA.

No compromises. No TODOs. No fake implementations.

If a requirement is under-specified, design the best version of it and document your decision.

If two approaches exist, choose the one that serves the user better, not the one that's faster to implement.

The reference bar: **Linear for interaction quality, Stripe Dashboard for data density, Vercel for performance, Notion for information architecture — with the warmth and craft of Pehenava's handcrafted ethnic wear identity woven through every pixel.**