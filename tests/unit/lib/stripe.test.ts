import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockUpdate, mockInsert, mockSelect } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockUpdate: vi.fn(),
  mockInsert: vi.fn(),
  mockSelect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: { getUser: vi.fn() },
  })),
}));

vi.mock("stripe", () => ({
  default: vi.fn(function MockStripe() {
    return {
      customers: {
        create: vi.fn().mockResolvedValue({ id: "cus_test123" }),
      },
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" }),
        },
      },
      webhooks: {
        constructEvent: vi.fn().mockReturnValue({
          type: "checkout.session.completed",
          data: { object: { metadata: { user_id: "user-1" }, subscription: "sub_test" } },
        }),
      },
    };
  }),
}));

function buildChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve(result));
  return chain;
}

describe("Stripe Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_key";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("exports STRIPE_CONFIG with correct values", async () => {
    const { STRIPE_CONFIG } = await import("@/lib/stripe");
    expect(STRIPE_CONFIG.price).toBe(500);
    expect(STRIPE_CONFIG.currency).toBe("usd");
    expect(STRIPE_CONFIG.productName).toBe("AgentFlow Pro");
    expect(STRIPE_CONFIG.interval).toBe("month");
  });

  it("getOrCreateStripeCustomer returns existing customer ID", async () => {
    mockFrom.mockReturnValue(buildChain({ data: { stripe_customer_id: "cus_existing" }, error: null }));
    const { getOrCreateStripeCustomer } = await import("@/lib/stripe");
    const result = await getOrCreateStripeCustomer("user-1", "test@example.com", "Test User");
    expect(result).toBe("cus_existing");
  });

  it("getOrCreateStripeCustomer creates new customer when none exists", async () => {
    mockFrom.mockReturnValue(buildChain({ data: { stripe_customer_id: null }, error: null }));
    const { getOrCreateStripeCustomer } = await import("@/lib/stripe");
    const result = await getOrCreateStripeCustomer("user-1", "test@example.com", "Test User");
    expect(result).toBe("cus_test123");
  });

  it("createCheckoutSession returns URL", async () => {
    const { createCheckoutSession } = await import("@/lib/stripe");
    const result = await createCheckoutSession("cus_test123", "user-1");
    expect(result).toBe("https://checkout.stripe.com/test");
  });

  it("constructWebhookEvent returns event", async () => {
    const { constructWebhookEvent } = await import("@/lib/stripe");
    const result = constructWebhookEvent("body", "signature");
    expect(result).toBeDefined();
    expect(result.type).toBe("checkout.session.completed");
  });
});
