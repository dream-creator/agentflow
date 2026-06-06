import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { getBrowserOrigin, getAuthCallbackUrl } from "@/lib/auth";

describe("getBrowserOrigin", () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    }
  });

  it("returns window.location.origin when window is defined", () => {
    vi.stubGlobal("window", { location: { origin: "http://localhost:3000" } });
    expect(getBrowserOrigin()).toBe("http://localhost:3000");
  });

  it("works for Vercel preview URLs", () => {
    vi.stubGlobal("window", {
      location: { origin: "https://agentflow-abc123.vercel.app" },
    });
    expect(getBrowserOrigin()).toBe("https://agentflow-abc123.vercel.app");
  });

  it("works for the canonical production domain", () => {
    vi.stubGlobal("window", {
      location: { origin: "https://agent-flow.app" },
    });
    expect(getBrowserOrigin()).toBe("https://agent-flow.app");
  });

  it("falls back to NEXT_PUBLIC_APP_URL in server context (no window)", () => {
    vi.stubGlobal("window", undefined);
    process.env.NEXT_PUBLIC_APP_URL = "https://agent-flow.app";
    expect(getBrowserOrigin()).toBe("https://agent-flow.app");
  });

  it("returns empty string when no window and no env var", () => {
    vi.stubGlobal("window", undefined);
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getBrowserOrigin()).toBe("");
  });
});

describe("getAuthCallbackUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns /auth/callback on the current origin by default", () => {
    vi.stubGlobal("window", { location: { origin: "http://localhost:3000" } });
    expect(getAuthCallbackUrl()).toBe("http://localhost:3000/auth/callback");
  });

  it("supports custom path argument", () => {
    vi.stubGlobal("window", { location: { origin: "http://localhost:3000" } });
    expect(getAuthCallbackUrl("/reset-password")).toBe(
      "http://localhost:3000/reset-password",
    );
  });
});
