/**
 * Changelog utilities for the public /changelog page.
 *
 * Pure functions, no React, no fetch. The data lives in
 * `src/data/changelog.ts` and is sorted/filtered/grouped here.
 *
 * Why split the data from the transform? Lets us write unit tests
 * against fixed fixtures (deterministic) and keeps the page component
 * tiny.
 */

export type ChangelogEntry = {
  /** URL-safe slug, used as React key and optional anchor */
  id: string;
  /** ISO date string (YYYY-MM-DD) — the date the entry describes */
  date: string;
  /** Optional semver, e.g. "0.19.0" */
  version?: string;
  /** Short, marketing-tone title (e.g. "Maintenance banner + feature flags") */
  title: string;
  /** 1-2 sentence summary in plain English */
  summary: string;
  /** Bullet points — specific changes, file names, etc. */
  items: string[];
  /** When true, renders at the top regardless of date */
  pinned?: boolean;
  /** Optional call-to-action link (e.g. "Read the technical breakdown →") */
  cta?: { label: string; href: string };
  /**
   * If set, the entry is hidden until this date (inclusive).
   * Use for scheduled releases.
   */
  publishedAt?: string;
};

/**
 * Sort entries: pinned first (in their own date-desc block), then
 * unpinned by date descending. Does not mutate the input.
 */
export function sortChangelog(entries: ChangelogEntry[]): ChangelogEntry[] {
  return [...entries].sort((a, b) => {
    // Pinned always come first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    // Within the same pinned/unpinned group, sort by date descending
    return b.date.localeCompare(a.date);
  });
}

/**
 * Filter out entries with `publishedAt` strictly in the future.
 * Entries with no `publishedAt` are always included.
 * `publishedAt` equal to `now` is INCLUDED (boundary is inclusive).
 */
export function getPublishedEntries(
  entries: ChangelogEntry[],
  now: Date
): ChangelogEntry[] {
  const nowMs = now.getTime();
  return entries.filter((entry) => {
    if (!entry.publishedAt) return true;
    const publishMs = new Date(entry.publishedAt).getTime();
    return publishMs <= nowMs;
  });
}

type MonthGroup = {
  month: string;
  entries: ChangelogEntry[];
};

/**
 * Group entries by "Month YYYY" header, sorted by calendar month
 * descending (most recent first). Entries within a group preserve
 * their input order (callers should pass already-sorted entries).
 *
 * Note: groups are sorted by the underlying date, not the
 * "Month YYYY" string. Alphabetical sort would put "July" before
 * "June" which is the wrong calendar order.
 */
export function groupByMonth(entries: ChangelogEntry[]): MonthGroup[] {
  const groups = new Map<string, { month: string; firstDate: string; entries: ChangelogEntry[] }>();

  for (const entry of entries) {
    const month = formatMonth(entry.date);
    const existing = groups.get(month);
    if (existing) {
      existing.entries.push(entry);
    } else {
      groups.set(month, { month, firstDate: entry.date, entries: [entry] });
    }
  }

  return Array.from(groups.values())
    .sort((a, b) => b.firstDate.localeCompare(a.firstDate))
    .map(({ month, entries }) => ({ month, entries }));
}

/**
 * Format an ISO date string as "Month YYYY" (e.g. "June 2026").
 * Uses UTC to avoid timezone-dependent test flakes.
 */
function formatMonth(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00Z");
  const month = date.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const year = date.getUTCFullYear();
  return `${month} ${year}`;
}
