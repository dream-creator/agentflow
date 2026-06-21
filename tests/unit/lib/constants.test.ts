import { describe, it, expect } from "vitest";

describe("PLAN_LIMITS", () => {
  it("has correct free tier limits", async () => {
    const { PLAN_LIMITS } = await import("@/lib/constants");
    expect(PLAN_LIMITS.free.maxActiveLeads).toBe(10);
    expect(PLAN_LIMITS.free.maxPipelines).toBe(10);
  });

  it("has unlimited pro tier limits", async () => {
    const { PLAN_LIMITS } = await import("@/lib/constants");
    expect(PLAN_LIMITS.pro.maxActiveLeads).toBe(Infinity);
    expect(PLAN_LIMITS.pro.maxPipelines).toBe(Infinity);
  });

  it("has unlimited team tier limits", async () => {
    const { PLAN_LIMITS } = await import("@/lib/constants");
    expect(PLAN_LIMITS.team.maxActiveLeads).toBe(Infinity);
    expect(PLAN_LIMITS.team.maxPipelines).toBe(Infinity);
  });

  it("covers all plan types", async () => {
    const { PLAN_LIMITS } = await import("@/lib/constants");
    expect(Object.keys(PLAN_LIMITS)).toEqual(["free", "pro", "team"]);
  });

  it("free tier limits are numbers", async () => {
    const { PLAN_LIMITS } = await import("@/lib/constants");
    expect(typeof PLAN_LIMITS.free.maxActiveLeads).toBe("number");
    expect(typeof PLAN_LIMITS.free.maxPipelines).toBe("number");
  });

  it("pro tier limits are Infinity", async () => {
    const { PLAN_LIMITS } = await import("@/lib/constants");
    expect(PLAN_LIMITS.pro.maxActiveLeads).toBe(Infinity);
    expect(PLAN_LIMITS.pro.maxPipelines).toBe(Infinity);
  });
});
