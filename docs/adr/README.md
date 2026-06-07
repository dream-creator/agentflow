# Architecture Decision Records (ADRs)

This directory contains the architectural decision records for AgentFlow.

## What is an ADR?

An ADR captures **one significant decision**, the context that led to it,
the alternatives we considered, and the consequences — both positive
and negative. It is written _at the time the decision is made_, not in
retrospect, so future contributors can understand _why_ the code looks
the way it does.

ADRs are **immutable**. When a decision is reversed, a new ADR is
written that supersedes the old one (the old ADR is updated to point
to its replacement; it is not edited in place).

## When to write one

Write an ADR when the decision:

- Restricts future implementation options ("we will _always_ do X")
- Affects the public surface of the product (auth, billing, data model, deployment)
- Was the result of weighing at least two real alternatives
- Would be hard to reverse without a migration or a coordinated rollout
- Will be referenced from multiple files / subsystems

Examples that warrant an ADR:

- "We use Supabase Auth instead of rolling our own"
- "Feature flags are driven by env vars, not a remote service"
- "We use Postgres triggers for plan-limit enforcement, not just app code"

Examples that do **not** warrant an ADR:

- "We use Tailwind 3.4 instead of 3.3" (version bump, not architectural)
- "We named the file X.ts" (naming is not architectural)
- "We use Zod for input validation" (library choice within an existing pattern)

## File naming

```
NNNN-short-kebab-title.md
```

- `NNNN` is a 4-digit zero-padded sequence (0001, 0002, ...).
- The title is a short, descriptive kebab-case summary.
- The number is assigned at creation time and never re-used, even if
  the ADR is later superseded.

## Status values

| Status | Meaning |
| --- | --- |
| `Proposed` | Drafted but not yet adopted. Open for discussion. |
| `Accepted` | Adopted and currently in effect. |
| `Deprecated` | No longer the recommended approach, but still in the code. |
| `Superseded by ADR-NNNN` | Reversed. The new ADR's filename is in the status line. |

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [0001](./0001-env-var-feature-flags.md) | Env-var feature flag system | Accepted |
