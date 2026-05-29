# AgentFlow

**The CRM for agents who hate CRMs.**

AgentFlow is a lightweight, mobile-first CRM built specifically for real estate agents who want to manage their pipeline without the bloat of enterprise software. Track leads, manage follow-ups, and close deals — all from your phone.

---

## Features

### Lead Management
- **Add leads manually** or **import via CSV** with automatic column detection
- **6-stage pipeline**: New Lead → Contacted → Showing → Offer → Closed Won → Closed Lost
- **Search and filter** leads by name, stage, or source
- **Lead sources**: Manual, CSV Import, Website, Referral, Open House, Zillow, Other

### Follow-ups & Reminders
- **Daily digest email** — get a summary of overdue and upcoming follow-ups every morning
- **Overdue / Today / Upcoming** sections in the follow-ups view
- **Quick actions** — call, text, email, or schedule meetings directly from a lead

### Pipeline View
- Visual pipeline with leads organized by stage
- Move leads between stages with one click
- Track conversion rates across your funnel

### Mobile-First Design
- **Bottom navigation** for thumb-friendly access on phones
- **44px minimum touch targets** for accessibility
- **PWA support** — installable on home screen with offline caching

### Authentication & Security
- **Magic Link sign-in** — no passwords, just email
- **Google OAuth** — one-click sign-in with Google
- **Row Level Security (RLS)** — users can only see their own data
- **Encrypted at rest** via Supabase/PostgreSQL

### Payments
- **Free tier**: 1 active lead
- **Pro tier**: $19/month — unlimited leads, pipelines, and custom branding
- **Stripe integration** — secure checkout and subscription management

### CI/CD
- **4-tier pipeline**: PR Gatekeeper → Staging Promotion → Production Release → Health Check
- **Automated testing** with 84 unit tests and 99%+ coverage
- **Semantic versioning** with automatic changelog generation

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, TypeScript) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) with custom design tokens |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL + RLS) |
| **Auth** | [Supabase Auth](https://supabase.com/docs/guides/auth) (Magic Link + Google OAuth) |
| **Payments** | [Stripe](https://stripe.com/) ($19/mo Pro tier) |
| **Email** | [Resend](https://resend.com/) (daily digest cron + transactional) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Testing** | [Vitest](https://vitest.dev/) (unit) + [Playwright](https://playwright.dev/) (E2E) |
| **CI/CD** | [GitHub Actions](https://github.com/features/actions) (4 workflows) |
| **Hosting** | [Vercel](https://vercel.com/) (frontend) + [Supabase Cloud](https://supabase.com/) (backend) |
| **PWA** | Service worker with network-first navigation + cache-first assets |

---

## File Structure

```
agentflow/
├── .github/
│   └── workflows/
│       ├── pr-gatekeeper.yml          # PR checks: lint, test, coverage, preview deploy
│       ├── staging-promotion.yml      # Staging: migrate, type-check, E2E, deploy
│       ├── production-release.yml     # Production: approve, snapshot, migrate, deploy, changelog
│       └── scheduled-health-check.yml # Hourly health checks on production + staging
│
├── public/
│   ├── manifest.json                  # PWA manifest
│   ├── sw.js                          # Service worker (offline caching)
│   └── icons/
│       ├── icon-192.png               # PWA icon 192x192
│       └── icon-512.png               # PWA icon 512x512
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql     # Database schema (profiles, leads, actions)
│
├── src/
│   ├── middleware.ts                   # Auth middleware (route protection)
│   │
│   ├── app/
│   │   ├── layout.tsx                 # Root layout (fonts, PWA meta)
│   │   ├── page.tsx                   # Landing page (marketing)
│   │   ├── globals.css                # Tailwind layers + custom classes
│   │   │
│   │   ├── auth/
│   │   │   └── callback/route.ts      # OAuth callback handler
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx         # Magic Link + Google sign-in
│   │   │   └── signup/page.tsx        # Magic Link + Google sign-up
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Dashboard layout (sidebar + bottom nav)
│   │   │   ├── dashboard/page.tsx     # Today's follow-ups
│   │   │   ├── pipeline/page.tsx      # Pipeline view (6 stages)
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx           # Leads list (search + filter)
│   │   │   │   ├── new/page.tsx       # Add new lead form
│   │   │   │   ├── import/page.tsx    # CSV import (upload, map, review, done)
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # Lead detail (contact, actions, quick actions)
│   │   │   │       └── edit/page.tsx  # Edit lead form
│   │   │   ├── follow-ups/page.tsx    # Overdue / Today / Upcoming
│   │   │   └── settings/
│   │   │       ├── page.tsx           # Profile + plan badge + sign out
│   │   │       └── billing/page.tsx   # Stripe checkout + plan comparison
│   │   │
│   │   ├── api/
│   │   │   ├── leads/
│   │   │   │   ├── route.ts           # GET (list) + POST (create)
│   │   │   │   └── [id]/route.ts      # GET + PUT + DELETE (single lead)
│   │   │   ├── stripe/
│   │   │   │   ├── checkout/route.ts  # POST - create Stripe checkout session
│   │   │   │   └── webhook/route.ts   # POST - handle Stripe webhooks
│   │   │   └── cron/
│   │   │       └── daily-digest/route.ts  # GET - send daily email digest
│   │   │
│   │   └── (dashboard)/layout.tsx     # Dashboard layout wrapper
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── dashboard-layout.tsx   # Sidebar + BottomNav wrapper
│   │   │   ├── sidebar.tsx            # Desktop sidebar navigation
│   │   │   └── bottom-nav.tsx         # Mobile bottom navigation
│   │   └── ui/
│   │       ├── button.tsx             # Button (5 variants, 3 sizes)
│   │       ├── badge.tsx              # Badge (6 color variants)
│   │       ├── card.tsx               # Card, CardHeader, CardTitle, CardContent
│   │       ├── empty-state.tsx        # EmptyState + Toast components
│   │       ├── skeleton.tsx           # Loading skeleton
│   │       └── sw-register.tsx        # Service worker registration
│   │
│   ├── lib/
│   │   ├── utils.ts                   # cn() utility (clsx + tailwind-merge)
│   │   └── supabase/
│   │       ├── client.ts              # Browser Supabase client
│   │       ├── server.ts              # Server-side Supabase client
│   │       └── middleware.ts          # Session + auth protection logic
│   │
│   └── types/
│       └── index.ts                   # Database types (profiles, leads, actions)
│
├── tests/
│   └── unit/
│       ├── lib/
│       │   ├── utils.test.ts          # cn() utility tests
│       │   └── supabase/
│       │       └── middleware.test.ts  # Auth middleware tests
│       └── api/
│           ├── leads.test.ts          # Leads API tests
│           ├── leads-id.test.ts       # Single lead API tests
│           ├── stripe/
│           │   ├── checkout.test.ts   # Stripe checkout tests
│           │   └── webhook.test.ts    # Stripe webhook tests
│           └── cron/
│               └── daily-digest.test.ts  # Daily digest tests
│
├── .env.local.example                 # Environment variables template
├── .gitignore                         # Git ignore rules
├── ARCHITECTURE.md                    # Technical architecture docs
├── next.config.mjs                    # Next.js configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
├── tsconfig.json                      # TypeScript configuration
├── vitest.config.ts                   # Vitest test configuration
└── package.json                       # Dependencies + scripts
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20)
- **npm** or **yarn**
- **Supabase account** (free tier works for development)
- **Stripe account** (test mode for development)
- **Resend account** (free tier works for development)

### 1. Clone the repository

```bash
git clone https://github.com/dream-creator/agentflow.git
cd agentflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your own credentials:

```bash
# Supabase (from supabase.com → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (from stripe.com → Developers → API Keys)
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key

# Resend (from resend.com → API Keys)
RESEND_API_KEY=re_your-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up the database

Run the migration in your Supabase SQL editor or via CLI:

```bash
supabase db push --db-url your-database-url
```

The schema creates 3 tables with RLS policies and triggers:
- `profiles` — user profiles (auto-created on signup)
- `leads` — CRM leads with pipeline stages
- `actions` — follow-up tasks

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Set up Stripe webhooks (for payments)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

---

## Database Schema

### Tables

**profiles** — extends Supabase auth.users
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | FK to auth.users |
| `full_name` | text | User's full name |
| `email` | text | User's email |
| `plan` | enum | `free`, `pro`, `team` |
| `stripe_customer_id` | text | Stripe customer ID |
| `subscription_status` | enum | `active`, `inactive`, `cancelled`, `past_due` |

**leads** — core CRM entity
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to profiles |
| `full_name` | text | Lead's name |
| `email` | text | Lead's email |
| `phone` | text | Lead's phone |
| `source` | enum | `manual`, `csv_import`, `website`, `referral`, `open_house`, `zillow`, `other` |
| `pipeline_stage` | enum | `new_lead`, `contacted`, `showing`, `offer`, `closed_won`, `closed_lost` |
| `next_action` | text | Next action to take |
| `next_action_date` | date | When to take action |
| `is_active` | boolean | Soft delete flag |

**actions** — follow-up tasks
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `lead_id` | uuid | FK to leads |
| `user_id` | uuid | FK to profiles |
| `action_type` | enum | `call`, `text`, `email`, `meeting`, `showing`, `note` |
| `due_date` | date | When due |
| `completed` | boolean | Completion status |

### Row Level Security

All tables have RLS enabled. Users can only access their own data:
- `profiles`: `auth.uid() = id`
- `leads`: `auth.uid() = user_id`
- `actions`: `auth.uid() = user_id`

---

## Testing

### Unit Tests (Vitest)

84 tests across 7 test files with 99%+ coverage:

```bash
npm test                    # Run all tests
npm run test:coverage       # Run with coverage report
npm run test:watch          # Watch mode
```

**Test files:**
- `tests/unit/lib/utils.test.ts` — cn() utility
- `tests/unit/lib/supabase/middleware.test.ts` — Auth middleware
- `tests/unit/api/leads.test.ts` — Leads API (GET, POST)
- `tests/unit/api/leads-id.test.ts` — Single lead API (GET, PUT, DELETE)
- `tests/unit/api/stripe/checkout.test.ts` — Stripe checkout
- `tests/unit/api/stripe/webhook.test.ts` — Stripe webhooks
- `tests/unit/api/cron/daily-digest.test.ts` — Daily email digest

### E2E Tests (Playwright)

Configuration is set up but tests are pending. Run with:

```bash
npx playwright test
```

---

## CI/CD Pipeline

### 1. PR Gatekeeper (on pull request)
- Lint & type check
- Security audit
- Unit tests with coverage gate (75% minimum)
- Preview deployment
- Lighthouse CI

### 2. Staging Promotion (on push to develop)
- Database migrations to staging
- Type synchronization check
- E2E test matrix (auth, CSV, Stripe)
- Staging deployment

### 3. Production Release (on push to main)
- Manual approval gate
- Pre-migration PITR snapshot
- Database migrations
- Vercel production deployment
- Post-deploy smoke tests
- GitHub Release with semantic versioning and changelog

### 4. Scheduled Health Check (hourly)
- Production login page
- Health endpoint
- PWA manifest
- Auth guards
- Staging verification
- Cron liveness check

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repository in Vercel
3. Set environment variables
4. Deploy

### Environment Variables for Production

Set these in Vercel Dashboard → Settings → Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
STRIPE_SECRET_KEY=sk_live_your-live-key
STRIPE_WEBHOOK_SECRET=whsec_your-live-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-live-key
RESEND_API_KEY=re_your-live-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
CRON_SECRET=your-random-secret
```

---

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/leads` | GET | User | List all active leads |
| `/api/leads` | POST | User | Create a new lead |
| `/api/leads/[id]` | GET | User | Get a single lead |
| `/api/leads/[id]` | PUT | User | Update a lead |
| `/api/leads/[id]` | DELETE | User | Soft-delete a lead |
| `/api/stripe/checkout` | POST | User | Create Stripe checkout session |
| `/api/stripe/webhook` | POST | Stripe | Handle Stripe webhooks |
| `/api/cron/daily-digest` | GET | Bearer token | Send daily follow-up emails |

---

## Security

- **Row Level Security (RLS)** on all database tables
- **No passwords** — Magic Link + Google OAuth only
- **Environment variables** — secrets never committed to git
- **Service role key** — server-side only, never exposed to client
- **Stripe webhooks** — signature verification on all incoming events
- **Cron secret** — bearer token required for automated tasks

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `style:` — formatting (no code change)
- `refactor:` — code restructuring
- `test:` — adding tests
- `chore:` — maintenance

---

## License

MIT

---

## Support

- **Issues**: [GitHub Issues](https://github.com/dream-creator/agentflow/issues)
- **Email**: support@agentflow.app

---

Built with care for real estate agents who want to focus on closing deals, not managing software.
