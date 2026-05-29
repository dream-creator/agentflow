import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom, mockCustomersCreate, mockSessionsCreate } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockCustomersCreate: vi.fn(),
  mockSessionsCreate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("stripe", () => {
  return {
    default: vi.fn(function MockStripe(this: Record<string, unknown>) {
      this.customers = { create: mockCustomersCreate };
      this.checkout = { sessions: { create: mockSessionsCreate } };
    }),
  };
});

vi.mock("next/server", () => ({
  NextRequest: class NextRequest {
    url: string;
    method: string;
    constructor(url: string, init?: RequestInit) {
      this.url = url;
      this.method = init?.method || "GET";
    }
  },
  NextResponse: {
    json: vi.fn((data: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

import { POST } from "@/app/api/stripe/checkout/route";
import { NextRequest } from "next/server";

function buildChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve(result));
  return chain;
}

describe("/api/stripe/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("returns 500 if STRIPE_SECRET_KEY is not set", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", { method: "POST" });
    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it("returns 401 if user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", { method: "POST" });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("creates a new Stripe customer if none exists", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockReturnValue(buildChain({
      data: { stripe_customer_id: null, email: "test@example.com", full_name: "Test User" }, error: null,
    }));
    mockCustomersCreate.mockResolvedValue({ id: "cus_new_123" });
    mockSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/abc" });

    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", { method: "POST" });
    await POST(request);
    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: "test@example.com", name: "Test User", metadata: { user_id: "user-1" },
    });
  });

  it("updates profile with new customer ID", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const chain = buildChain({
      data: { stripe_customer_id: null, email: "test@example.com", full_name: "Test" }, error: null,
    });
    mockFrom.mockReturnValue(chain);
    mockCustomersCreate.mockResolvedValue({ id: "cus_new_123" });
    mockSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/abc" });

    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", { method: "POST" });
    await POST(request);
    expect(chain.update).toHaveBeenCalledWith({ stripe_customer_id: "cus_new_123" });
  });

  it("reuses existing Stripe customer", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockReturnValue(buildChain({
      data: { stripe_customer_id: "cus_existing_456", email: "test@example.com", full_name: "Test" }, error: null,
    }));
    mockSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/abc" });

    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", { method: "POST" });
    await POST(request);
    expect(mockCustomersCreate).not.toHaveBeenCalled();
  });

  it("creates a checkout session with correct parameters", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockReturnValue(buildChain({
      data: { stripe_customer_id: "cus_123", email: "test@example.com", full_name: "Test" }, error: null,
    }));
    mockSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/abc" });

    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", { method: "POST" });
    await POST(request);
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_123", mode: "subscription", payment_method_types: ["card"],
        metadata: { user_id: "user-1" },
      })
    );
  });

  it("returns checkout session URL", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockReturnValue(buildChain({
      data: { stripe_customer_id: "cus_123", email: "test@example.com", full_name: "Test" }, error: null,
    }));
    mockSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/abc" });

    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", { method: "POST" });
    const response = await POST(request);
    const body = await response.json();
    expect(body).toEqual({ url: "https://checkout.stripe.com/abc" });
  });

  it("handles customer without name gracefully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockReturnValue(buildChain({
      data: { stripe_customer_id: null, email: "test@example.com", full_name: null }, error: null,
    }));
    mockCustomersCreate.mockResolvedValue({ id: "cus_new_123" });
    mockSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/abc" });

    const request = new NextRequest("http://localhost:3000/api/stripe/checkout", { method: "POST" });
    await POST(request);
    expect(mockCustomersCreate).toHaveBeenCalledWith(expect.objectContaining({ name: undefined }));
  });
});
