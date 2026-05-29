# AgentFlow — Technical Architecture & Engineering Roadmap

## Project Identity

| Field | Value |
|-------|-------|
| **Name** | AgentFlow |
| **Tagline** | The CRM for agents who hate CRMs |
| **Repo** | `github.com/dream-creator/agentflow` |
| **Stack** | Next.js 14 (App Router) + Tailwind CSS + Supabase + Stripe + Resend |
| **Hosting** | Vercel (frontend) + Supabase Cloud (DB/Auth) |
| **Target** | Solo real estate agents, 5–20 transactions/year |

---

## Design System (ui-ux-pro-max)

| Token | Value | Rationale |
|-------|-------|-----------|
| **Style** | Minimalism + Flat Design | Daily-use utility; zero cognitive load |
| **Primary** | `#0F766E` (Teal 700) | Trust, calm, professionalism |
| **On Primary** | `#FFFFFF` | |
| **Secondary** | `#14B8A6` (Teal 400) | Accent highlights |
| **Accent/CTA** | `#0369A1` (Sky 700) | Action buttons, links |
| **Background** | `#F0FDFA` (Teal 50) | Soft, non-fatiguing |
| **Surface** | `#FFFFFF` | Cards, modals |
| **Foreground** | `#134E4A` (Teal 900) | Primary text |
| **Muted** | `#94A3B8` (Slate 400) | Secondary text |
| **Border** | `#E2E8F0` (Slate 200) | Dividers |
| **Destructive** | `#DC2626` (Red 600) | Delete, danger |
| **Font Heading** | Plus Jakarta Sans (700) | Modern, geometric, professional |
| **Font Body** | Inter (400/500) | Maximum readability at 16px |
| **Radius** | 8px (cards), 6px (inputs), 999px (pills) | |
| **Shadow** | `0 1px 3px rgba(0,0,0,0.1)` | Subtle elevation |
| **Icons** | Lucide React (SVG) | No emojis |

### Anti-Patterns (ui-ux-pro-max enforced)

- No emoji as icons
- No hover-only interactions
- Min touch target 44×44px
- Body text min 16px
- Contrast ratio ≥ 4.5:1
- Visible focus rings on all interactive elements
- prefers-reduced-motion respected

---

# PHASE 1: MVP Architecture & Data Flow

## 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Next.js 14 App Router                     │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Marketing   │  │   Dashboard  │  │   Auth      │  │  │
│  │  │  Landing     │  │   (Client)   │  │   Pages     │  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │  │
│  │         │                │                 │          │  │
│  │  ┌──────┴───────────────┴─────────────────┴──────┐   │  │
│  │  │           Route Handlers (API)                  │   │  │
│  │  │  /api/leads  /api/pipeline  /api/stripe        │   │  │
│  │  └──────────────────┬─────────────────────────────┘   │  │
│  └─────────────────────┼─────────────────────────────────┘  │
│                        │                                     │
└────────────────────────┼─────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────────┐
          │              │                  │
    ┌─────┴─────┐  ┌─────┴─────┐  ┌────────┴────────┐
    │  Supabase  │  │  Stripe   │  │     Resend      │
    │  ┌───────┐ │  │  ┌─────┐  │  │  ┌───────────┐  │
    │  │Postgre│ │  │  │Check│  │  │  │ Transaction│  │
    │  │  SQL  │ │  │  │ out │  │  │  │   Email    │  │
    │  └───────┘ │  │  └─────┘  │  │  └───────────┘  │
    │  ┌───────┐ │  │  ┌─────┐  │  │                 │
    │  │ Auth  │ │  │  │Webho│  │  │                 │
    │  │       │ │  │  │oks  │  │  │                 │
    │  └───────┘ │  │  └─────┘  │  │                 │
    └───────────┘  └───────────┘  └─────────────────┘
```

### Data Flow Summary

1. **Auth Flow:** User → Supabase Auth (Magic Link / Google OAuth) → JWT → Middleware → Dashboard
2. **Lead CRUD:** Dashboard → Route Handler → Supabase PostgreSQL → Realtime update → UI
3. **Pipeline View:** Dashboard → Route Handler → Query by stage → Render kanban/list
4. **Daily Digest:** Cron job (Vercel) → Query overdue/today actions → Resend API → Email to user
5. **Stripe Checkout:** Dashboard → /api/stripe/checkout → Stripe Session → Redirect → Webhook → Update profile tier

## 1.2 Database Schema (PostgreSQL via Supabase)

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  brokerage TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- LEADS (core entity)
-- ============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv_import', 'website', 'referral', 'open_house', 'zillow', 'other')),
  pipeline_stage TEXT NOT NULL DEFAULT 'new_lead' CHECK (pipeline_stage IN (
    'new_lead',
    'contacted',
    'showing',
    'offer',
    'closed_won',
    'closed_lost'
  )),
  notes TEXT,
  next_action TEXT,
  next_action_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ACTIONS (follow-up tracking)
-- ============================================
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('call', 'text', 'email', 'meeting', 'showing', 'note')),
  description TEXT,
  due_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_pipeline_stage ON leads(pipeline_stage);
CREATE INDEX idx_leads_next_action_date ON leads(next_action_date) WHERE is_active = true;
CREATE INDEX idx_actions_due_date ON actions(due_date) WHERE completed = false;
CREATE INDEX idx_actions_user_id ON actions(user_id);
CREATE INDEX idx_actions_lead_id ON actions(lead_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Leads: users can only CRUD their own leads
CREATE POLICY "Users can view own leads" ON leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON leads FOR DELETE USING (auth.uid() = user_id);

-- Actions: users can only CRUD their own actions
CREATE POLICY "Users can view own actions" ON actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own actions" ON actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own actions" ON actions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own actions" ON actions FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Free tier lead limit (1 lead)
-- ============================================
CREATE OR REPLACE FUNCTION check_free_tier_lead_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_plan TEXT;
  lead_count BIGINT;
BEGIN
  SELECT plan INTO current_plan FROM profiles WHERE id = NEW.user_id;

  IF current_plan = 'free' THEN
    SELECT COUNT(*) INTO lead_count FROM leads WHERE user_id = NEW.user_id AND is_active = true;

    IF lead_count >= 1 THEN
      RAISE EXCEPTION 'Free tier limited to 1 active lead. Upgrade to Pro for unlimited.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER enforce_free_tier_limit
  BEFORE INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION check_free_tier_lead_limit();
```

### Schema ERD Summary

```
profiles ──┬── leads ──── actions
            │
            └── auth.users (Supabase)
```

- **1 profile → many leads** (1:N)
- **1 lead → many actions** (1:N)
- **1 profile → many actions** (1:N, via user_id for RLS)
- **RLS enforced** at database level — zero trust on client

## 1.3 UI/UX Implementation Guide

### Layout Rules (ui-ux-pro-max enforced)

| Rule | Implementation |
|------|----------------|
| Mobile-first | Tailwind `sm:`, `md:`, `lg:` breakpoints. Design at 375px first. |
| Bottom nav (mobile) | Max 5 items: Dashboard, Pipeline, Add Lead, Follow-ups, Profile |
| Sidebar (desktop) | ≥1024px: sidebar nav replaces bottom bar |
| Min touch target | 44×44px on all buttons/links |
| Body text | Inter 16px minimum, line-height 1.5 |
| Heading hierarchy | h1 → h2 → h3 sequential, no skip |
| Focus rings | `focus-visible:ring-2 focus-visible:ring-[#0F766E]` on all interactive |
| Skeleton loading | Shimmer placeholders for all async content |
| Empty states | Actionable message + CTA for every empty list |
| Error feedback | Toast (bottom) for transient, inline for forms |
| Contrast | All text ≥ 4.5:1, large text ≥ 3:1 |

### Page Structure

```
app/
├── layout.tsx              # Root layout, fonts, providers
├── page.tsx                # Landing page (marketing)
├── (auth)/
│   ├── login/page.tsx      # Magic link + Google OAuth
│   └── signup/page.tsx     # Registration
├── (dashboard)/
│   ├── layout.tsx          # Dashboard shell (nav, sidebar)
│   ├── page.tsx            # Daily follow-up view (home)
│   ├── pipeline/page.tsx   # Kanban/list pipeline
│   ├── leads/
│   │   ├── page.tsx        # Lead list
│   │   ├── [id]/page.tsx   # Lead detail
│   │   └── new/page.tsx    # Add lead form
│   ├── follow-ups/page.tsx # All follow-ups
│   └── settings/page.tsx   # Profile, billing
├── api/
│   ├── leads/route.ts      # CRUD leads
│   ├── leads/[id]/route.ts # Single lead
│   ├── pipeline/route.ts   # Pipeline data
│   ├── stripe/checkout/route.ts
│   ├── stripe/webhook/route.ts
│   └── cron/daily-digest/route.ts  # Daily email
└── middleware.ts            # Auth guard, RLS check
```

### Component Library

| Component | Purpose | Tailwind Classes |
|-----------|---------|------------------|
| `<Button>` | Primary/secondary/destructive variants | `bg-[#0F766E] text-white rounded-lg px-4 py-2 min-h-[44px]` |
| `<Input>` | Text, email, phone, date | `border border-[#E2E8F0] rounded-md px-3 py-2 min-h-[44px] focus:ring-2 focus:ring-[#0F766E]` |
| `<Card>` | Content container | `bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-4` |
| `<Badge>` | Pipeline stage indicator | `text-xs font-medium px-2 py-1 rounded-full` |
| `<Toast>` | Success/error notifications | Fixed bottom, auto-dismiss 3s |
| `<Skeleton>` | Loading placeholder | `animate-pulse bg-slate-200 rounded` |
| `<EmptyState>` | No-data message | Centered icon + text + CTA button |
| `<BottomNav>` | Mobile navigation | Fixed bottom, 5 items, 44px min height |
| `<Sidebar>` | Desktop navigation | Fixed left, collapsible, icons + labels |

---

# PHASE 2: Development Phase

## 2.1 Environment Setup

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 20.x | Runtime |
| npm | ≥ 10.x | Package manager |
| Git | ≥ 2.40 | Version control |
| Supabase CLI | Latest | Local dev, migrations |
| Vercel CLI | Latest | Preview deploys |

### Local `.env.local` Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Resend
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Setup Commands

```bash
# Clone & install
git clone git@github.com:dream-creator/agentflow.git
cd agentflow
npm install

# Supabase local
supabase init
supabase start
supabase db reset  # applies migrations

# Vercel link
vercel link

# Run dev
npm run dev
```

## 2.2 Version Control Protocol

### Branch Strategy

```
main                    ← production (protected)
├── develop             ← integration branch (protected)
│   ├── feat/auth       ← feature branches
│   ├── feat/pipeline
│   ├── feat/stripe
│   └── fix/lead-limit
```

### Branch Naming

| Pattern | Use |
|---------|-----|
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `refactor/<name>` | Code refactoring |
| `docs/<name>` | Documentation only |
| `chore/<name>` | Tooling, config, deps |

### Commit Convention

```
<type>(<scope>): <description>

feat(auth): add magic link login
feat(pipeline): implement kanban view
fix(leads): prevent free tier exceeding 1 lead
chore(deps): update next to 14.2.3
```

### PR Standards

- Title matches commit convention
- Description includes: What, Why, How, Screenshots (UI changes)
- Max 300 lines changed per PR (prefer smaller)
- Requires 1 approval (solo: self-review with 10min cooldown)
- CI must pass (lint, typecheck, tests)
- Squash merge to `develop`, merge commit to `main`

## 2.3 Engineering Sprints (Day 1–30 → Technical Sprints)

### Sprint 1: Foundation (Day 1–3) — "Skeleton"

| Task | Hours | Deliverable |
|------|-------|-------------|
| Initialize Next.js 14 project | 1 | `npx create-next-app@latest` with TS, Tailwind, App Router |
| Configure Tailwind with design tokens | 1 | `tailwind.config.ts` with custom colors, fonts, spacing |
| Set up Supabase local + migration files | 2 | Schema deployed, RLS enabled |
| Create root layout + auth pages | 2 | `/login`, `/signup` with Magic Link + Google OAuth |
| Deploy skeleton to Vercel | 1 | `vercel deploy` — landing page visible |
| **Milestone** | | **Live URL, auth working, DB schema deployed** |

### Sprint 2: Core Features (Day 4–7) — "Product"

| Task | Hours | Deliverable |
|------|-------|-------------|
| Lead CRUD (API + UI) | 6 | Create, read, update, delete leads |
| Pipeline view (list) | 4 | Leads grouped by stage, drag-to-move (desktop) |
| Add lead form (30-sec flow) | 2 | Name, source, phone, email, next action + date |
| Lead detail page | 2 | Full lead info, action history, edit |
| Daily follow-up view | 3 | Leads with overdue/today actions, one-tap call/text/email |
| CSV import | 3 | Upload CSV, map columns, batch insert |
| **Milestone** | | **Core loop working: add lead → set action → see in daily view** |

### Sprint 3: Polish & Email (Day 8–10) — "Mobile"

| Task | Hours | Deliverable |
|------|-------|-------------|
| Mobile-responsive layout | 4 | Bottom nav, touch targets, safe areas |
| PWA manifest + service worker | 2 | Installable on home screen |
| Daily digest email (Resend) | 3 | Cron job: query today's actions → send email |
| Empty states + error handling | 2 | Every list has actionable empty state |
| Loading skeletons | 2 | Shimmer for all async content |
| **Milestone** | | **Mobile-first, installable, daily email working** |

### Sprint 4: Launch Prep (Day 11–12) — "Ship"

| Task | Hours | Deliverable |
|------|-------|-------------|
| Production Supabase project | 1 | Create project, run migrations, seed data |
| Environment variables (Vercel) | 1 | All secrets in Vercel dashboard |
| Production deploy | 1 | `vercel --prod` |
| Invite 3 beta testers | 1 | Send signup links, onboard |
| **Milestone** | | **Production live, 3 beta users onboarded** |

### Sprint 5: Iterate (Day 15–17) — "Fix"

| Task | Hours | Deliverable |
|------|-------|-------------|
| Beta feedback triage | 1 | Categorize all feedback |
| Top 3 bug fixes | 4 | Address critical issues |
| UX improvements from feedback | 3 | Refine pain points |
| **Milestone** | | **Top issues resolved, feedback loop closed** |

### Sprint 6: Billing (Day 20–21) — "Monetize"

| Task | Hours | Deliverable |
|------|-------|-------------|
| Stripe Checkout integration | 4 | Pro tier $19/mo checkout flow |
| Stripe webhook handler | 3 | Update profile plan on payment |
| Free tier enforcement | 2 | 1 lead limit for free users |
| Billing settings page | 2 | View plan, upgrade, manage |
| **Milestone** | | **Stripe billing live, Pro tier purchasable** |

### Sprint 7: Pre-Launch (Day 25–29) — "Polish"

| Task | Hours | Deliverable |
|------|-------|-------------|
| Landing page copy + design | 4 | Conversion-optimized, mobile-first |
| Product Hunt assets | 2 | Screenshots, tagline, description |
| SEO meta tags + OG images | 1 | Social sharing optimized |
| Final QA pass | 3 | Full regression on mobile + desktop |
| **Milestone** | | **Launch-ready, PH assets prepared** |

---

# PHASE 3: Staging & QA

## 3.1 CI/CD Pipeline

```
GitHub Push/PR
     │
     ▼
┌─────────────────┐
│  GitHub Actions  │
│  ┌─────────────┐ │
│  │ Lint (ESLint)│ │
│  │ TypeCheck    │ │
│  │ Unit Tests   │ │
│  └──────┬──────┘ │
└─────────┼────────┘
          │
          ▼
┌─────────────────┐
│  Vercel Preview  │ ← Auto-deploys on PR
│  Deployment      │ ← Unique URL per PR
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase       │ ← Branch databases for preview
│  Preview DB     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Manual QA      │ ← Test on preview URL
│  + E2E Tests    │
└────────┬────────┘
         │
         ▼ (merge to main)
┌─────────────────┐
│  Vercel Prod    │
│  Deployment     │
└─────────────────┘
```

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test -- --coverage
```

## 3.2 Testing Strategy

### Unit Tests (Vitest)

| Module | Test | Coverage Target |
|--------|------|-----------------|
| `lib/leads.ts` | Lead CRUD operations | 90% |
| `lib/pipeline.ts` | Stage transitions, validation | 90% |
| `lib/stripe.ts` | Checkout session creation, webhook parsing | 85% |
| `lib/resend.ts` | Email template rendering, send | 80% |
| `middleware.ts` | Auth guard, redirect logic | 95% |

### E2E Tests (Playwright)

| Flow | Steps | Priority |
|------|-------|----------|
| **Auth → Dashboard** | Sign up → Verify redirect → See empty dashboard | P0 |
| **Add Lead → Daily View** | Add lead → Set action → See in daily follow-up | P0 |
| **Pipeline Flow** | Add lead → Move through stages → Mark closed | P0 |
| **CSV Import** | Upload CSV → Map columns → Verify leads created | P1 |
| **Upgrade Flow** | Click upgrade → Stripe checkout → Verify Pro status | P1 |
| **Mobile Navigation** | Bottom nav → All pages → Touch targets | P1 |

### Critical Path E2E Spec

```typescript
// tests/e2e/critical-path.spec.ts
test.describe('Critical Path: Auth → Add Lead → Daily Follow-up', () => {
  test('user can sign up, add a lead, and see it in daily view', async ({ page }) => {
    // 1. Sign up
    await page.goto('/signup');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    // Verify magic link sent

    // 2. (Simulate auth callback)
    // 3. Add lead
    await page.click('[data-testid="add-lead"]');
    await page.fill('input[name="full_name"]', 'Dan Smith');
    await page.fill('input[name="phone"]', '555-0123');
    await page.selectOption('select[name="source"]', 'open_house');
    await page.fill('input[name="next_action"]', 'Follow up about listing');
    await page.fill('input[name="next_action_date"]', '2026-05-30');
    await page.click('button[type="submit"]');

    // 4. Verify in daily view
    await page.goto('/follow-ups');
    await expect(page.locator('text=Dan Smith')).toBeVisible();
    await expect(page.locator('text=Follow up about listing')).toBeVisible();
  });
});
```

## 3.3 Quality Gates

### Before Staging Approval

| Gate | Tool | Threshold | Blocking? |
|------|------|-----------|-----------|
| ESLint | `npm run lint` | 0 errors, 0 warnings | Yes |
| TypeScript | `npm run typecheck` | 0 errors | Yes |
| Unit Tests | `npm test -- --coverage` | ≥ 80% coverage | Yes |
| E2E Tests | `npx playwright test` | All critical flows pass | Yes |
| Lighthouse Performance | Lighthouse CI | ≥ 90 | Yes |
| Lighthouse Accessibility | Lighthouse CI | ≥ 95 | Yes |
| Lighthouse PWA | Lighthouse CI | ≥ 90 | No (warning) |
| Bundle Size | `next build` | < 250KB first load JS | No (warning) |
| Security Audit | `npm audit` | 0 critical, 0 high | Yes |
| Supabase RLS | Manual + `supabase db diff` | All tables have RLS | Yes |
| No secrets in code | `git grep` for keys | 0 matches | Yes |
| Touch targets | Manual check | All ≥ 44px | No (warning) |
| Contrast ratios | Manual check | All ≥ 4.5:1 | No (warning) |

---

# PHASE 4: Production & Maintenance

## 4.1 Deployment Checklist

### Pre-Production

- [ ] All Phase 3 quality gates passing
- [ ] Supabase production project created
- [ ] Production database migrations applied
- [ ] Stripe live mode configured
- [ ] Resend verified sender domain
- [ ] Environment variables set in Vercel (production)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (Vercel default)
- [ ] DNS records pointing to Vercel

### Production Deploy

```bash
# 1. Merge to main
git checkout main
git merge develop
git push origin main

# 2. Vercel auto-deploys (or manual)
vercel --prod

# 3. Verify
curl -I https://agentflow.app
# Should return 200

# 4. Run smoke tests
npx playwright test tests/e2e/critical-path.spec.ts --headed

# 5. Monitor Vercel dashboard for errors
```

### Post-Deploy Verification

| Check | Expected | How |
|-------|----------|-----|
| Landing page loads | 200 OK | Browser |
| Auth flow works | Magic link received | Test signup |
| Dashboard loads after auth | Redirect works | Manual test |
| Add lead works | Lead appears in list | Manual test |
| Daily digest email | Email received | Check Resend logs |
| Stripe checkout | Pro upgrade works | Test checkout |
| Mobile PWA | Installable | Test on phone |

## 4.2 Monitoring & Observability

### Tool Stack

| Tool | Purpose | Cost |
|------|---------|------|
| **Vercel Analytics** | Web Vitals, page performance | Free tier |
| **Vercel Speed Insights** | Real-user performance data | Free tier |
| **Sentry** | Error tracking, stack traces | Free tier (5K events/mo) |
| **Supabase Dashboard** | DB metrics, auth logs, API usage | Free tier |
| **Resend Dashboard** | Email delivery, bounces, opens | Free tier |
| **Stripe Dashboard** | Payments, subscriptions, disputes | Pay per transaction |

### Error Tracking Configuration

```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
});
```

### Key Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| LCP (Largest Contentful Paint) | < 2.5s | > 4.0s |
| FID (First Input Delay) | < 100ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | > 0.25 |
| Error rate | < 0.1% | > 1% |
| API response time (p95) | < 500ms | > 2s |
| Email delivery rate | > 99% | < 95% |
| Stripe webhook success | > 99.9% | < 99% |

### Log Drains

```bash
# Vercel log drain to external service
vercel logs --token $VERCEL_TOKEN --follow
```

### Uptime Monitoring

- Set up **Betterstack** or **Checkly** for uptime checks
- Monitor: `https://agentflow.app/api/health`
- Alert via email + SMS if downtime > 1 minute

## 4.3 Maintenance Schedule

| Frequency | Task |
|-----------|------|
| Daily | Check Sentry for new errors |
| Weekly | Review Vercel Analytics for performance regressions |
| Weekly | Check Supabase dashboard for DB growth |
| Monthly | `npm audit` + dependency updates |
| Monthly | Review Stripe churn, billing issues |
| Quarterly | Full security audit |
| Quarterly | Performance audit (Lighthouse, bundle size) |

## 4.4 Scaling Considerations (Post-Launch)

| Milestone | Action |
|-----------|--------|
| 100 users | Upgrade Supabase to Pro ($25/mo) |
| 500 users | Add Redis caching for daily digest queries |
| 1,000 users | Implement rate limiting on API routes |
| 2,000 users | Evaluate Vercel Pro plan for bandwidth |
| 5,000 users | Consider dedicated Supabase instance |

---

# Appendix A: File Structure

```
agentflow/
├── .github/
│   └── workflows/
│       └── ci.yml
├── prisma/                     # (not used — Supabase direct)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── icons/                  # PWA icons
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Landing
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # Daily follow-ups
│   │   │   ├── pipeline/page.tsx
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── follow-ups/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── leads/route.ts
│   │       ├── leads/[id]/route.ts
│   │       ├── stripe/checkout/route.ts
│   │       ├── stripe/webhook/route.ts
│   │       └── cron/daily-digest/route.ts
│   ├── components/
│   │   ├── ui/                 # Button, Input, Card, Badge, Toast, Skeleton
│   │   ├── layout/             # BottomNav, Sidebar, Header
│   │   ├── leads/              # LeadCard, LeadForm, LeadList
│   │   ├── pipeline/           # PipelineBoard, StageColumn
│   │   └── follow-ups/         # FollowUpList, FollowUpCard
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   └── middleware.ts   # Auth middleware
│   │   ├── stripe.ts
│   │   ├── resend.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useLeads.ts
│   │   ├── usePipeline.ts
│   │   └── useFollowUps.ts
│   └── types/
│       └── index.ts
├── tests/
│   ├── unit/
│   └── e2e/
├── .env.local.example
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

# Appendix B: NPM Dependencies

```json
{
  "dependencies": {
    "next": "14.2.x",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "stripe": "^16.0.0",
    "resend": "^3.5.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.4.0",
    "@hello-pangea/dnd": "^16.6.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^1.6.0",
    "@vitejs/plugin-react": "^4.3.0",
    "playwright": "^1.44.0",
    "@playwright/test": "^1.44.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.x",
    "sentry": "^0.1.0"
  }
}
```
