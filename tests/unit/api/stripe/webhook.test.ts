import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockConstructEvent } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockConstructEvent: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("stripe", () => {
  return {
    default: vi.fn(function MockStripe(this: Record<string, unknown>) {
      this.webhooks = { constructEvent: mockConstructEvent };
    }),
  };
});

vi.mock("next/server", () => ({
  NextRequest: class NextRequest {
    url: string;
    method: string;
    private _body: string;
    private _headers: Map<string, string>;
    constructor(url: string, init?: RequestInit) {
      this.url = url;
      this.method = init?.method || "GET";
      this._body = (init?.body as string) || "";
      this._headers = new Map();
      if (init?.headers) {
        const h = init.headers as Record<string, string>;
        for (const [k, v] of Object.entries(h)) this._headers.set(k, v);
      }
    }
    async text() { return this._body; }
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

import { POST } from "@/app/api/stripe/webhook/route";
import { NextRequest } from "next/server";

function buildChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve(result));
  return chain;
}

describe("/api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
  });

  it("returns 500 if STRIPE_SECRET_KEY is not set", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST", body: "test-body",
      headers: { "stripe-signature": "sig_test" } as unknown as HeadersInit,
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it("returns 500 if STRIPE_WEBHOOK_SECRET is not set", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST", body: "test-body",
      headers: { "stripe-signature": "sig_test" } as unknown as HeadersInit,
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it("returns 400 if no stripe-signature header", async () => {
    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST", body: "test-body",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 if webhook signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error("Invalid signature"); });
    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST", body: "test-body",
      headers: { "stripe-signature": "sig_invalid" } as unknown as HeadersInit,
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("handles checkout.session.completed event", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { metadata: { user_id: "user-1" }, subscription: "sub_123" } },
    });
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST", body: "test-body",
      headers: { "stripe-signature": "sig_valid" } as unknown as HeadersInit,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "pro", stripe_subscription_id: "sub_123", subscription_status: "active" })
    );
  });

  it("handles checkout.session.completed without user_id gracefully", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { metadata: {}, subscription: "sub_123" } },
    });
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }));

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST", body: "test-body",
      headers: { "stripe-signature": "sig_valid" } as unknown as HeadersInit,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it("handles customer.subscription.deleted event", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_123" } },
    });
    const findChain = buildChain({ data: { id: "user-1" }, error: null });
    const updateChain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(findChain).mockReturnValueOnce(updateChain);

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST", body: "test-body",
      headers: { "stripe-signature": "sig_valid" } as unknown as HeadersInit,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "free", subscription_status: "cancelled" })
    );
  });

  it("handles subscription.deleted when profile not found", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_nonexistent" } },
    });
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }));

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST", body: "test-body",
      headers: { "stripe-signature": "sig_valid" } as unknown as HeadersInit,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it("handles invoice.payment_failed event", async () => {
    mockConstructEvent.mockReturnValue({
      type: "invoice.payment_failed",
      data: { object: { customer: "cus_123" } },
    });
    const findChain = buildChain({ data: { id: "user-1" }, error: null });
    const updateChain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(findChain).mockReturnValueOnce(updateChain);

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST", body: "test-body",
      headers: { "stripe-signature": "sig_valid" } as unknown as HeadersInit,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_status: "past_due" })
    );
  });

  it("handles invoice.payment_failed when profile not found", async () => {
    mockConstructEvent.mockReturnValue({
      type: "invoice.payment_failed",
      data: { object: { customer: "cus_nonexistent" } },
    });
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }));

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST", body: "test-body",
      headers: { "stripe-signature": "sig_valid" } as unknown as HeadersInit,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it("returns received: true for all handled events", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { metadata: { user_id: "user-1" }, subscription: "sub_123" } },
    });
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }));

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST", body: "test-body",
      headers: { "stripe-signature": "sig_valid" } as unknown as HeadersInit,
    });
    const response = await POST(request);
    const body = await response.json();
    expect(body).toEqual({ received: true });
  });

  it("handles unrecognised event types gracefully", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: { object: {} },
    });

    const request = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST", body: "test-body",
      headers: { "stripe-signature": "sig_valid" } as unknown as HeadersInit,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
