# AgentFlow

> The CRM built exclusively for real estate professionals — manage your pipeline, automate follow-ups, and close more deals from any device.

[![Status](https://img.shields.io/badge/status-live-brightgreen)](https://agentflow.app)
[![License: BUSL 1.1](https://img.shields.io/badge/License-BUSL_1.1-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

---

## What is AgentFlow?

AgentFlow is a lightweight, mobile-first CRM designed specifically for independent real estate agents and small brokerages. Most CRM platforms are built for large sales teams and come loaded with complexity agents don't need. AgentFlow strips that away and focuses on what actually moves deals forward: knowing who to follow up with, and when.

**Built for agents in the field, not behind a desk.**

---

## Features

### Lead Pipeline
Manage every lead through a clean, six-stage pipeline — from first contact to closed deal. Move leads between stages in one tap and track conversion across your entire funnel.

### Smart Follow-ups
Never miss a follow-up again. AgentFlow sends a daily digest to your inbox every morning with a prioritized view of overdue, today's, and upcoming actions.

### One-Click Client Actions
Call, text, email, or schedule a meeting directly from a lead's profile — no copy-pasting, no switching apps.

### CSV Import
Bring your existing leads in instantly. AgentFlow automatically detects and maps your CSV columns so you're up and running in minutes.

### Mobile-First & Installable
Fully optimized for mobile with a bottom navigation bar and 44px touch targets. Install it directly to your home screen as a Progressive Web App (PWA) with offline support.

### Secure by Default
Passwordless sign-in via Magic Link or Google OAuth — no passwords to manage or leak. Every user's data is strictly isolated at the database level.

---

## Pricing

| Plan | Price | Leads |
|---|---|---|
| **Free** | $0 / month | 1 active lead |
| **Pro** | $19 / month | Unlimited leads, pipelines & custom branding |

[→ Get started at agentflow.app](https://agentflow.app)

---

## Tech Stack

AgentFlow is built on a modern, production-grade stack:

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS 3.4 |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (Magic Link + Google OAuth) |
| Payments | Stripe |
| Email | Resend |
| Testing | Vitest (84 tests, 99%+ coverage) + Playwright (E2E) |
| CI/CD | GitHub Actions (4-stage automated pipeline) |
| Hosting | Vercel + Supabase Cloud |
| PWA | Service worker with offline caching |

---

## Security

AgentFlow is designed with a security-first approach. User data is strictly isolated at the database level — no user can ever access another user's data. All authentication is passwordless, sensitive credentials are never exposed to the client, and all payment events are cryptographically verified before processing.

---

## Support

Have a question, found a bug, or want to request a feature?

- **Email:** support@agentflow.app
- **Issues:** [GitHub Issues](https://github.com/dream-creator/agentflow/issues)

---

## License

This software is licensed under the [Business Source License 1.1 (BUSL 1.1)](LICENSE).

The source code is publicly available for review and non-production use. Commercial use, self-hosting, and redistribution require explicit written permission from AgentFlow.

After four (4) years from each release date, that version's code converts to the [MIT License](https://opensource.org/licenses/MIT).

For commercial licensing or enterprise inquiries, contact [support@agentflow.app](mailto:support@agentflow.app).

Copyright © 2025 AgentFlow. All rights reserved.
