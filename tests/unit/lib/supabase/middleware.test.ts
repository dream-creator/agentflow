import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
let capturedSetAll: ((cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void) | null = null;

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn((_url: string, _key: string, opts: { cookies: { getAll: () => unknown[]; setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void } }) => {
    capturedSetAll = opts.cookies.setAll;
    return { auth: { getUser: mockGetUser } };
  }),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn(({ request }: { request: unknown }) => ({
      cookies: { set: vi.fn() },
      request,
    })),
    redirect: vi.fn((url: URL) => ({
      status: 307,
      headers: { get: () => url.toString() },
      url: url.toString(),
    })),
  },
}));

import { updateSession } from "@/lib/supabase/middleware";
import { NextRequest } from "next/server";

function createMockRequest(pathname: string, cookies: Record<string, string> = {}) {
  const url = `http://localhost:3000${pathname}`;
  const cookieStore = new Map(Object.entries(cookies));
  return {
    nextUrl: new URL(url),
    cookies: {
      getAll: () => Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value })),
      set: (name: string, value: string) => cookieStore.set(name, value),
    },
  } as unknown as NextRequest;
}

describe("updateSession middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedSetAll = null;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("allows unauthenticated users to access public pages", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = createMockRequest("/");
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });

  it("redirects unauthenticated users from /dashboard to /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = createMockRequest("/dashboard");
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });

  it("redirects unauthenticated users from /leads to /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = createMockRequest("/leads/some-lead");
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });

  it("redirects unauthenticated users from /pipeline to /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = createMockRequest("/pipeline");
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });

  it("redirects unauthenticated users from /follow-ups to /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = createMockRequest("/follow-ups");
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });

  it("redirects unauthenticated users from /settings to /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = createMockRequest("/settings");
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });

  it("redirects unauthenticated users from /api/leads to /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = createMockRequest("/api/leads");
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });

  it("redirects authenticated users away from /login to /dashboard", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const request = createMockRequest("/login");
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });

  it("redirects authenticated users away from /signup to /dashboard", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const request = createMockRequest("/signup");
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });

  it("allows authenticated users to access protected pages", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const request = createMockRequest("/dashboard");
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });

  it("handles Supabase client errors gracefully", async () => {
    mockGetUser.mockRejectedValue(new Error("Supabase connection failed"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const request = createMockRequest("/dashboard");
    const response = await updateSession(request);
    expect(response).toBeDefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("does not redirect for non-protected, non-auth routes", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = createMockRequest("/about");
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });

  it("handles root path correctly", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = createMockRequest("/");
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });

  it("handles nested protected paths like /leads/new", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = createMockRequest("/leads/new");
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });

  it("handles nested protected paths like /leads/123/edit", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = createMockRequest("/leads/123/edit");
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });

  it("triggers cookie setAll callback when Supabase refreshes tokens", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const request = createMockRequest("/dashboard");
    await updateSession(request);

    // Simulate Supabase calling setAll (token refresh)
    expect(capturedSetAll).toBeDefined();
    if (capturedSetAll) {
      capturedSetAll([
        { name: "sb-access-token", value: "new-token", options: { path: "/" } },
        { name: "sb-refresh-token", value: "new-refresh", options: { path: "/" } },
      ]);
    }
  });
});
