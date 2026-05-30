import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockSelect, mockEq, mockOrder, mockSingle, mockMaybeSingle } = vi.hoisted(() => {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.single = vi.fn();
  chain.maybeSingle = vi.fn();
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);

  return {
    mockFrom: vi.fn(() => chain),
    mockSelect: chain.select,
    mockEq: chain.eq,
    mockOrder: chain.order,
    mockSingle: chain.single,
    mockMaybeSingle: chain.maybeSingle,
  };
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
      }),
    },
  })),
}));

describe("useLeads hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports fetchLeads function", async () => {
    const mod = await import("@/hooks/useLeads");
    expect(typeof mod.fetchLeads).toBe("function");
  });

  it("exports createLead function", async () => {
    const mod = await import("@/hooks/useLeads");
    expect(typeof mod.createLead).toBe("function");
  });

  it("exports updateLead function", async () => {
    const mod = await import("@/hooks/useLeads");
    expect(typeof mod.updateLead).toBe("function");
  });

  it("exports deleteLead function", async () => {
    const mod = await import("@/hooks/useLeads");
    expect(typeof mod.deleteLead).toBe("function");
  });
});

describe("useProfile hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports fetchProfile function", async () => {
    const mod = await import("@/hooks/useProfile");
    expect(typeof mod.fetchProfile).toBe("function");
  });

  it("exports updateProfile function", async () => {
    const mod = await import("@/hooks/useProfile");
    expect(typeof mod.updateProfile).toBe("function");
  });
});

describe("useActions hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports fetchActions function", async () => {
    const mod = await import("@/hooks/useActions");
    expect(typeof mod.fetchActions).toBe("function");
  });

  it("exports createAction function", async () => {
    const mod = await import("@/hooks/useActions");
    expect(typeof mod.createAction).toBe("function");
  });

  it("exports completeAction function", async () => {
    const mod = await import("@/hooks/useActions");
    expect(typeof mod.completeAction).toBe("function");
  });
});
