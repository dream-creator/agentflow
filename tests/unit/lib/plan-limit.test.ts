import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

function buildChain(result: { data: unknown; error: unknown; count?: number }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.then = (resolve: (v: unknown) => unknown) =>
    resolve({ data: result.data, error: result.error, count: result.count ?? 0 });
  return chain;
}

describe("checkPlanLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns allowed: false when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { checkPlanLimit } = await import("@/lib/plan-limit");
    const result = await checkPlanLimit();

    expect(result.allowed).toBe(false);
    expect(result.maxAllowed).toBe(0);
  });

  it("returns allowed: true when free user has 9 active leads", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const profileChain = buildChain({ data: { plan: "free" }, error: null });
    const countChain = buildChain({ data: null, error: null, count: 9 });

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(countChain);

    const { checkPlanLimit } = await import("@/lib/plan-limit");
    const result = await checkPlanLimit();

    expect(result.allowed).toBe(true);
    expect(result.plan).toBe("free");
    expect(result.currentCount).toBe(9);
    expect(result.maxAllowed).toBe(10);
  });

  it("returns allowed: false when free user has 10 active leads", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const profileChain = buildChain({ data: { plan: "free" }, error: null });
    const countChain = buildChain({ data: null, error: null, count: 10 });

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(countChain);

    const { checkPlanLimit } = await import("@/lib/plan-limit");
    const result = await checkPlanLimit();

    expect(result.allowed).toBe(false);
    expect(result.plan).toBe("free");
    expect(result.currentCount).toBe(10);
    expect(result.maxAllowed).toBe(10);
  });

  it("returns allowed: false when free user has 11 active leads", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const profileChain = buildChain({ data: { plan: "free" }, error: null });
    const countChain = buildChain({ data: null, error: null, count: 11 });

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(countChain);

    const { checkPlanLimit } = await import("@/lib/plan-limit");
    const result = await checkPlanLimit();

    expect(result.allowed).toBe(false);
    expect(result.currentCount).toBe(11);
  });

  it("returns allowed: true when free user has 0 active leads", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const profileChain = buildChain({ data: { plan: "free" }, error: null });
    const countChain = buildChain({ data: null, error: null, count: 0 });

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(countChain);

    const { checkPlanLimit } = await import("@/lib/plan-limit");
    const result = await checkPlanLimit();

    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(0);
  });

  it("returns allowed: true for pro user with 50 active leads", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const profileChain = buildChain({ data: { plan: "pro" }, error: null });
    const countChain = buildChain({ data: null, error: null, count: 50 });

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(countChain);

    const { checkPlanLimit } = await import("@/lib/plan-limit");
    const result = await checkPlanLimit();

    expect(result.allowed).toBe(true);
    expect(result.plan).toBe("pro");
    expect(result.currentCount).toBe(50);
    expect(result.maxAllowed).toBe(Infinity);
  });

  it("returns allowed: true for team user with 100 active leads", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const profileChain = buildChain({ data: { plan: "team" }, error: null });
    const countChain = buildChain({ data: null, error: null, count: 100 });

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(countChain);

    const { checkPlanLimit } = await import("@/lib/plan-limit");
    const result = await checkPlanLimit();

    expect(result.allowed).toBe(true);
    expect(result.plan).toBe("team");
    expect(result.maxAllowed).toBe(Infinity);
  });

  it("defaults to free plan when profile has no plan", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const profileChain = buildChain({ data: { plan: null }, error: null });
    const countChain = buildChain({ data: null, error: null, count: 5 });

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(countChain);

    const { checkPlanLimit } = await import("@/lib/plan-limit");
    const result = await checkPlanLimit();

    expect(result.allowed).toBe(true);
    expect(result.plan).toBe("free");
    expect(result.maxAllowed).toBe(10);
  });

  it("defaults to 0 count when query returns null", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const profileChain = buildChain({ data: { plan: "free" }, error: null });
    const countChain = buildChain({ data: null, error: null, count: undefined });

    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(countChain);

    const { checkPlanLimit } = await import("@/lib/plan-limit");
    const result = await checkPlanLimit();

    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(0);
  });
});
