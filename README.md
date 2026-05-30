# AgentFlow

> A lightweight, mobile-first CRM purpose-built for real estate professionals — manage your pipeline, automate follow-ups, and close more deals without the complexity of enterprise software.

[![Build Status](https://img.shields.io/github/actions/workflow/status/dream-creator/agentflow/pr-gatekeeper.yml?label=build)](https://github.com/dream-creator/agentflow/actions)
[![Test Coverage](https://img.shields.io/badge/coverage-99%25-brightgreen)](https://github.com/dream-creator/agentflow)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

AgentFlow is a SaaS CRM designed specifically for independent real estate agents and small brokerages. Unlike heavyweight enterprise platforms, AgentFlow delivers a focused, mobile-first experience with the core tools agents actually need: lead tracking, pipeline visualization, automated follow-up reminders, and one-click client communication.

**Key differentiators:**

- **Mobile-first architecture** — built for agents working in the field, not behind a desk
- **Zero-password authentication** — Magic Link and Google OAuth for frictionless access
- **Automated daily digest** — follow-up reminders delivered to your inbox every morning
- **Affordable Pro tier** — full-featured access at $19/month with no per-seat pricing surprises

---

## Features

### Lead Management
- Add leads manually or import via CSV with automatic column detection
- Six-stage pipeline: `New Lead` → `Contacted` → `Showing` → `Offer` → `Closed Won` → `Closed Lost`
- Search and filter leads by name, stage, or source
- Supported lead sources: Manual, CSV Import, Website, Referral, Open House, Zillow

### Follow-ups & Reminders
- Daily digest email summarizing overdue and upcoming follow-ups
- Organized follow-up view: Overdue / Today / Upcoming
- Quick actions directly from a lead: call, text, email, or schedule a meeting

### Pipeline View
- Visual Kanban-style pipeline organized by stage
- Single-click stage transitions
- Conversion rate tracking across your full funnel

### Mobile-First Design
- Bottom navigation optimized for one-handed use on mobile
- 44px minimum touch targets for accessibility compliance
- Progressive Web App (PWA) — installable on home screen with offline support

### Authentication & Security
- Passwordless sign-in via Magic Link or Google OAuth
- Row Level Security (RLS) — strict per-user data isolation at the database level
- Data encrypted at rest via Supabase/PostgreSQL

### Billing & Subscriptions
- **Free tier:** 1 active lead (suitable for evaluation)
- **Pro tier:** $19/month — unlimited leads, pipelines, and custom branding
- Stripe-powered checkout and subscription lifecycle management

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS 3.4 with custom design tokens |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Authentication | Supabase Auth (Magic Link + Google OAuth) |
| Payments | Stripe ($19/month Pro tier) |
| Transactional Email | Resend (daily digest cron + transactional emails) |
| Icons | Lucide React |
| Unit Testing | Vitest (84 tests, 99%+ coverage) |
| E2E Testing | Playwright |
| CI/CD | GitHub Actions (4 automated workflows) |
| Hosting | Vercel (frontend) + Supabase Cloud (backend) |
| PWA | Service worker — network-first navigation, cache-first assets |

---

## Getting Started

### Prerequisites

- Node.js 18+ (v20 recommended)
- npm or yarn
- [Supabase](https://supabase.com) account (free tier sufficient for development)
- [Stripe](https://stripe.com) account (test mode for development)
- [Resend](https://resend.com) account (free tier sufficient for development)

### 1. Clone the Repository

```bash
git clone https://github.com/dream-creator/agentflow.git
cd agentflow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Populate `.env.local` with your project credentials. See [Environment Variables](#environment-variables) for the full reference.

> **Security Notice:** Never commit `.env.local` or any service account private keys to version control.

### 4. Initialize the Database

Run the migration using the Supabase CLI or paste it directly into the Supabase SQL Editor:

```bash
supabase db push --db-url your-database-url
```

This creates three tables (`profiles`, `leads`, `actions`) with RLS policies and automated triggers.

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 6. Configure Stripe Webhooks (Payments)

1. Navigate to **Stripe Dashboard → Developers → Webhooks**
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Subscribe to events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in your environment file

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — server-side only |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `NEXT_PUBLIC_APP_URL` | Public application base URL |
| `CRON_SECRET` | Bearer token for securing cron job endpoints |

---

## Database Schema

### `profiles`
Extends Supabase `auth.users` with CRM-specific metadata.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Foreign key to `auth.users` |
| `full_name` | text | User's display name |
| `email` | text | User's email address |
| `plan` | enum | `free`, `pro`, `team` |
| `stripe_customer_id` | text | Associated Stripe customer ID |
| `subscription_status` | enum | `active`, `inactive`, `cancelled`, `past_due` |

### `leads`
Core CRM entity representing a prospective client.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to `profiles` |
| `full_name` | text | Lead's full name |
| `email` | text | Lead's email address |
| `phone` | text | Lead's phone number |
| `source` | enum | `manual`, `csv_import`, `website`, `referral`, `open_house`, `zillow`, `other` |
| `pipeline_stage` | enum | `new_lead`, `contacted`, `showing`, `offer`, `closed_won`, `closed_lost` |
| `next_action` | text | Description of the next follow-up action |
| `next_action_date` | date | Scheduled date for the next action |
| `is_active` | boolean | Soft-delete flag |

### `actions`
Follow-up tasks and activity log entries linked to leads.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `lead_id` | uuid | Foreign key to `leads` |
| `user_id` | uuid | Foreign key to `profiles` |
| `action_type` | enum | `call`, `text`, `email`, `meeting`, `showing`, `note` |
| `due_date` | date | Scheduled due date |
| `completed` | boolean | Completion status |

---

## API Reference

All endpoints require user-level authentication unless otherwise noted.

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/leads` | GET | User | Retrieve all active leads |
| `/api/leads` | POST | User | Create a new lead |
| `/api/leads/[id]` | GET | User | Retrieve a single lead by ID |
| `/api/leads/[id]` | PUT | User | Update a lead |
| `/api/leads/[id]` | DELETE | User | Soft-delete a lead |
| `/api/stripe/checkout` | POST | User | Initiate a Stripe checkout session |
| `/api/stripe/webhook` | POST | Stripe signature | Process incoming Stripe webhook events |
| `/api/cron/daily-digest` | GET | Bearer token | Trigger daily follow-up email digest |

---

## Testing

### Unit Tests (Vitest)

84 tests across 7 test files with 99%+ code coverage.

```bash
npm test                   # Run all unit tests
npm run test:coverage      # Generate coverage report
npm run test:watch         # Watch mode for development
```

**Test coverage:**

| File | Description |
|---|---|
| `lib/utils.test.ts` | `cn()` utility function |
| `lib/supabase/middleware.test.ts` | Auth middleware and route protection |
| `api/leads.test.ts` | Leads list and create endpoints |
| `api/leads-id.test.ts` | Single lead read, update, and delete |
| `api/stripe/checkout.test.ts` | Stripe checkout session creation |
| `api/stripe/webhook.test.ts` | Stripe webhook event handling |
| `api/cron/daily-digest.test.ts` | Daily email digest trigger |

### End-to-End Tests (Playwright)

```bash
npx playwright test
```

E2E test suites cover authentication flows, CSV import, and Stripe checkout. Configuration is in place; additional test cases are in active development.

---

## CI/CD Pipeline

AgentFlow uses a four-stage GitHub Actions pipeline for safe, automated delivery.

### 1. PR Gatekeeper *(on pull request)*
- ESLint and TypeScript type checks
- Dependency security audit
- Unit tests with 75% minimum coverage gate
- Preview deployment via Vercel
- Lighthouse CI performance audit

### 2. Staging Promotion *(on push to `develop`)*
- Database migrations applied to staging environment
- TypeScript type synchronization check
- Full E2E test matrix (auth, CSV import, Stripe)
- Staging deployment

### 3. Production Release *(on push to `main`)*
- Manual approval gate required
- Pre-migration point-in-time database snapshot
- Database migrations applied to production
- Vercel production deployment
- Post-deploy smoke tests
- Automated GitHub Release with semantic versioning and changelog

### 4. Scheduled Health Check *(runs hourly)*
- Production login page availability
- API health endpoint
- PWA manifest validation
- Auth guard verification
- Staging environment parity check
- Cron job liveness check

---

## Deployment

### Vercel (Recommended)

1. Push the repository to GitHub
2. Import the repository in the [Vercel Dashboard](https://vercel.com)
3. Add the required environment variables under **Settings → Environment Variables**
4. Deploy

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |

---

## Security

AgentFlow is designed with a security-first approach:

- **Row Level Security (RLS):** All database tables enforce per-user data isolation at the PostgreSQL level — users can never access another user's data.
- **Passwordless authentication:** Magic Link and Google OAuth eliminate credential-based attack vectors.
- **Secrets management:** All sensitive credentials are stored as environment variables and never committed to source control.
- **Server-side isolation:** The Supabase service role key is used exclusively in server-side contexts and is never exposed to the client.
- **Webhook verification:** All incoming Stripe webhook events are validated via signature verification before processing.
- **Cron security:** Automated digest endpoints are protected by a bearer token to prevent unauthorized execution.

---

## Contributing

AgentFlow is a proprietary, closed-source product. Contributions are limited to authorized team members and approved collaborators only.

If you have been granted repository access, please follow the workflow below to keep the codebase consistent and the review process efficient.

1. Create a feature branch from `develop`: `git checkout -b feature/your-feature-name`
2. Commit your changes following the [Conventional Commits](https://www.conventionalcommits.org/) specification
3. Push to your branch: `git push origin feature/your-feature-name`
4. Open a Pull Request against the `develop` branch for review

> **Note:** By submitting a Pull Request, you confirm that your contribution is your original work and that you have the right to grant AgentFlow a perpetual, irrevocable license to use it within this codebase.

### Commit Convention

This project enforces Conventional Commits for automated changelog generation and semantic versioning:

| Prefix | Purpose |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Formatting only (no logic change) |
| `refactor:` | Code restructuring without behavior change |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance tasks |

---

## License

Copyright © 2025 AgentFlow. All rights reserved.

This software and its source code are proprietary and confidential. No part of this codebase may be copied, modified, distributed, sublicensed, or used — in whole or in part — for any commercial or non-commercial purpose without the prior written permission of AgentFlow.

Authorized contributors granted access to this repository agree to keep all source code, architecture, and business logic strictly confidential. Access does not constitute a license to use, reproduce, or distribute this software outside the terms explicitly agreed upon in writing.

> For licensing inquiries, partnership opportunities, or enterprise access, contact [support@agentflow.app](mailto:support@agentflow.app).

---

## Support

- **Issues:** [GitHub Issues](https://github.com/dream-creator/agentflow/issues)
- **Email:** support@agentflow.app
