import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockSend } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockSend: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("resend", () => {
  return {
    Resend: vi.fn(function MockResend(this: Record<string, unknown>) {
      this.emails = { send: mockSend };
    }),
  };
});

vi.mock("next/server", () => ({
  NextRequest: class NextRequest {
    url: string;
    method: string;
    private _headers: Map<string, string>;
    constructor(url: string, init?: RequestInit) {
      this.url = url;
      this.method = init?.method || "GET";
      this._headers = new Map();
      if (init?.headers) {
        const h = init.headers as Record<string, string>;
        for (const [k, v] of Object.entries(h)) this._headers.set(k, v);
      }
    }
    get headers() {
      return { get: (name: string) => this._headers.get(name) || null };
    }
  },
  NextResponse: {
    json: vi.fn((data: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

import { GET } from "@/app/api/cron/daily-digest/route";
import { NextRequest } from "next/server";

function buildChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.not = vi.fn(() => Promise.resolve(result));
  return chain;
}

describe("/api/cron/daily-digest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("returns 401 if authorization header is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/cron/daily-digest");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns 401 if authorization header is wrong", async () => {
    const request = new NextRequest("http://localhost:3000/api/cron/daily-digest", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns 500 if RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;
    const request = new NextRequest("http://localhost:3000/api/cron/daily-digest", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    const response = await GET(request);
    expect(response.status).toBe(500);
  });

  it("returns 500 on database error", async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: { message: "DB error" } }));
    const request = new NextRequest("http://localhost:3000/api/cron/daily-digest", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    const response = await GET(request);
    expect(response.status).toBe(500);
  });

  it("returns zero counts when no leads need follow-up", async () => {
    mockFrom.mockReturnValue(buildChain({ data: [], error: null }));
    const request = new NextRequest("http://localhost:3000/api/cron/daily-digest", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    const response = await GET(request);
    const body = await response.json();
    expect(body).toEqual({ sent: 0, failed: 0 });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends email to user with overdue leads", async () => {
    const leads = [
      { user_id: "user-1", full_name: "John Doe", next_action: "Call back", next_action_date: "2026-05-29", profiles: { email: "john@example.com", full_name: "John" } },
    ];
    mockFrom.mockReturnValue(buildChain({ data: leads, error: null }));
    mockSend.mockResolvedValue({ error: null });

    const request = new NextRequest("http://localhost:3000/api/cron/daily-digest", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    const response = await GET(request);
    const body = await response.json();
    expect(body).toEqual({ sent: 1, failed: 0 });
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("sends email with correct subject for single lead", async () => {
    const leads = [
      { user_id: "user-1", full_name: "John Doe", next_action: "Call back", next_action_date: "2026-05-29", profiles: { email: "john@example.com", full_name: "John" } },
    ];
    mockFrom.mockReturnValue(buildChain({ data: leads, error: null }));
    mockSend.mockResolvedValue({ error: null });

    const request = new NextRequest("http://localhost:3000/api/cron/daily-digest", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    await GET(request);
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ subject: "1 follow-up due today" }));
  });

  it("sends email with correct subject for multiple leads", async () => {
    const leads = [
      { user_id: "user-1", full_name: "John", next_action: "Call", next_action_date: "2026-05-29", profiles: { email: "john@example.com", full_name: "John" } },
      { user_id: "user-1", full_name: "Jane", next_action: "Email", next_action_date: "2026-05-28", profiles: { email: "john@example.com", full_name: "John" } },
    ];
    mockFrom.mockReturnValue(buildChain({ data: leads, error: null }));
    mockSend.mockResolvedValue({ error: null });

    const request = new NextRequest("http://localhost:3000/api/cron/daily-digest", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    await GET(request);
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ subject: "2 follow-ups due today" }));
  });

  it("groups leads by user and sends separate emails", async () => {
    const leads = [
      { user_id: "user-1", full_name: "Lead A", next_action: "Call", next_action_date: "2026-05-29", profiles: { email: "user1@example.com", full_name: "User One" } },
      { user_id: "user-2", full_name: "Lead B", next_action: "Email", next_action_date: "2026-05-29", profiles: { email: "user2@example.com", full_name: "User Two" } },
    ];
    mockFrom.mockReturnValue(buildChain({ data: leads, error: null }));
    mockSend.mockResolvedValue({ error: null });

    const request = new NextRequest("http://localhost:3000/api/cron/daily-digest", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    const response = await GET(request);
    const body = await response.json();
    expect(body).toEqual({ sent: 2, failed: 0 });
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("includes lead name and action in email HTML", async () => {
    const leads = [
      { user_id: "user-1", full_name: "Acme Corp", next_action: "Send proposal", next_action_date: "2026-05-30", profiles: { email: "john@example.com", full_name: "John" } },
    ];
    mockFrom.mockReturnValue(buildChain({ data: leads, error: null }));
    mockSend.mockResolvedValue({ error: null });

    const request = new NextRequest("http://localhost:3000/api/cron/daily-digest", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    await GET(request);
    const html = mockSend.mock.calls[0][0].html;
    expect(html).toContain("Acme Corp");
    expect(html).toContain("Send proposal");
    expect(html).toContain("John");
  });

  it("handles email send failure gracefully", async () => {
    const leads = [
      { user_id: "user-1", full_name: "John", next_action: "Call", next_action_date: "2026-05-29", profiles: { email: "john@example.com", full_name: "John" } },
    ];
    mockFrom.mockReturnValue(buildChain({ data: leads, error: null }));
    mockSend.mockRejectedValue(new Error("Email service down"));

    const request = new NextRequest("http://localhost:3000/api/cron/daily-digest", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    const response = await GET(request);
    const body = await response.json();
    expect(body).toEqual({ sent: 0, failed: 1 });
  });

  it("handles mixed success and failure emails", async () => {
    const leads = [
      { user_id: "user-1", full_name: "Lead A", next_action: "Call", next_action_date: "2026-05-29", profiles: { email: "user1@example.com", full_name: "User One" } },
      { user_id: "user-2", full_name: "Lead B", next_action: "Email", next_action_date: "2026-05-29", profiles: { email: "user2@example.com", full_name: "User Two" } },
    ];
    mockFrom.mockReturnValue(buildChain({ data: leads, error: null }));
    mockSend.mockResolvedValueOnce({ error: null }).mockRejectedValueOnce(new Error("Fail"));

    const request = new NextRequest("http://localhost:3000/api/cron/daily-digest", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    const response = await GET(request);
    const body = await response.json();
    expect(body).toEqual({ sent: 1, failed: 1 });
  });

  it("queries leads with next_action not null", async () => {
    const chain = buildChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const request = new NextRequest("http://localhost:3000/api/cron/daily-digest", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    await GET(request);
    expect(chain.not).toHaveBeenCalledWith("next_action", "is", null);
  });

  it("includes follow-ups link in email", async () => {
    const leads = [
      { user_id: "user-1", full_name: "Test Lead", next_action: "Call", next_action_date: "2026-05-29", profiles: { email: "john@example.com", full_name: "John" } },
    ];
    mockFrom.mockReturnValue(buildChain({ data: leads, error: null }));
    mockSend.mockResolvedValue({ error: null });

    const request = new NextRequest("http://localhost:3000/api/cron/daily-digest", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    await GET(request);
    const html = mockSend.mock.calls[0][0].html;
    expect(html).toContain("http://localhost:3000/follow-ups");
  });
});
