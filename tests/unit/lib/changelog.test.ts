import { describe, it, expect } from "vitest";
import {
  sortChangelog,
  getPublishedEntries,
  groupByMonth,
  type ChangelogEntry,
} from "@/lib/changelog";

const NOW = new Date("2026-06-07T12:00:00Z");

const pinned: ChangelogEntry = {
  id: "shipping-status-bar",
  date: "2026-06-07",
  version: "0.19.0",
  title: "Maintenance banner + feature flags",
  summary: "We added a 'Shipping Status Bar' to your dashboard.",
  items: ["Amber banner with pulse dot", "Dismissible via X or Escape"],
  pinned: true,
};

const recent: ChangelogEntry = {
  id: "design-tokens",
  date: "2026-06-07",
  title: "Design token cleanup",
  summary: "Replaced 9 raw Tailwind palette references with semantic tokens.",
  items: ["toast.tsx", "StatsBar.tsx", "leads/[id]/page.tsx"],
};

const older: ChangelogEntry = {
  id: "turnstile-mobile-fix",
  date: "2026-06-05",
  title: "Turnstile mobile fix",
  summary: "10s timeout fallback for slow connections.",
  items: ["Visible error UI when script fails to load", "Retry button"],
};

const future: ChangelogEntry = {
  id: "scheduled-feature",
  date: "2026-07-01",
  title: "Scheduled feature (do not show yet)",
  summary: "This should be filtered out until publishedAt.",
  items: ["Item 1"],
  publishedAt: "2026-07-01T00:00:00Z",
};

const readyFuture: ChangelogEntry = {
  id: "ready-to-publish",
  date: "2026-06-08",
  title: "Tomorrow's release",
  summary: "publishedAt is in the past relative to NOW.",
  items: ["Item 1"],
  publishedAt: "2026-06-08T00:00:00Z",
};

describe("sortChangelog", () => {
  it("puts pinned entries first, then unpinned by date descending", () => {
    const result = sortChangelog([older, recent, pinned]);
    expect(result.map((e) => e.id)).toEqual([
      "shipping-status-bar", // pinned
      "design-tokens", // 2026-06-07 (tied date, but not pinned)
      "turnstile-mobile-fix", // 2026-06-05
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(sortChangelog([])).toEqual([]);
  });

  it("preserves all entries (no deduplication)", () => {
    const result = sortChangelog([pinned, recent, older]);
    expect(result).toHaveLength(3);
  });

  it("does not mutate the input array", () => {
    const input = [older, recent, pinned];
    const inputCopy = [...input];
    sortChangelog(input);
    expect(input).toEqual(inputCopy);
  });
});

describe("getPublishedEntries", () => {
  it("filters out entries with publishedAt in the future", () => {
    const result = getPublishedEntries(
      [pinned, recent, older, future, readyFuture],
      NOW
    );
    expect(result.map((e) => e.id)).not.toContain("scheduled-feature");
  });

  it("includes entries with no publishedAt field (immediately visible)", () => {
    const result = getPublishedEntries([pinned, recent, older], NOW);
    expect(result).toHaveLength(3);
  });

  it("includes entries with publishedAt <= now (just-published)", () => {
    // readyFuture has publishedAt 2026-06-08, which is after NOW (2026-06-07)
    // so it should be EXCLUDED
    const result = getPublishedEntries([readyFuture], NOW);
    expect(result).toHaveLength(0);
  });

  it("treats publishedAt as inclusive of exactly the same instant", () => {
    const justNow: ChangelogEntry = {
      id: "just-now",
      date: "2026-06-07",
      title: "Published exactly now",
      summary: "Boundary test",
      items: ["x"],
      publishedAt: NOW.toISOString(),
    };
    const result = getPublishedEntries([justNow], NOW);
    expect(result).toHaveLength(1);
  });
});

describe("groupByMonth", () => {
  it("collapses same-month entries into a single group", () => {
    const result = groupByMonth([pinned, recent, older]);
    expect(result).toHaveLength(1);
    expect(result[0].month).toBe("June 2026");
    expect(result[0].entries).toHaveLength(3);
  });

  it("puts more recent month first when months differ (calendar order, not alphabetical)", () => {
    const july: ChangelogEntry = {
      id: "july",
      date: "2026-07-15",
      title: "July entry",
      summary: "x",
      items: ["x"],
    };
    const result = groupByMonth([older, july]);
    expect(result[0].month).toBe("July 2026");
    expect(result[0].entries.map((e) => e.id)).toEqual(["july"]);
    expect(result[1].month).toBe("June 2026");
    expect(result[1].entries.map((e) => e.id)).toEqual(["turnstile-mobile-fix"]);
  });

  it("handles 'June' vs 'July' correctly (the alphabetical trap)", () => {
    // "July" < "June" alphabetically, but July is later in time.
    // This test specifically guards against alphabetical sort.
    const june: ChangelogEntry = {
      id: "june",
      date: "2026-06-15",
      title: "June",
      summary: "x",
      items: ["x"],
    };
    const july: ChangelogEntry = {
      id: "july",
      date: "2026-07-15",
      title: "July",
      summary: "x",
      items: ["x"],
    };
    const result = groupByMonth([june, july]);
    expect(result.map((g) => g.month)).toEqual(["July 2026", "June 2026"]);
  });

  it("groups multiple entries in the same month together", () => {
    const sameMonth: ChangelogEntry = {
      id: "same-month",
      date: "2026-06-01",
      title: "Same month",
      summary: "x",
      items: ["x"],
    };
    const result = groupByMonth([older, sameMonth]);
    expect(result).toHaveLength(1);
    expect(result[0].entries).toHaveLength(2);
    expect(result[0].entries.map((e) => e.id)).toEqual([
      "turnstile-mobile-fix",
      "same-month",
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(groupByMonth([])).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input = [older, recent, pinned];
    const inputCopy = [...input];
    groupByMonth(input);
    expect(input).toEqual(inputCopy);
  });
});
