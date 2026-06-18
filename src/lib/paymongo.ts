import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

// ── Types ──────────────────────────────────────────────────────────────

export class PayMongoError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "PayMongoError";
  }
}

interface PayMongoConfig {
  amount: number; // centavos (45000 = ₱450.00)
  currency: string;
  productName: string;
  productDescription: string;
  interval: "month" | "year";
  intervalCount: number;
}

interface PayMongoApiResponse<T = unknown> {
  data: {
    id: string;
    type: string;
    attributes: T;
  };
}

interface PayMongoListResponse<T = unknown> {
  data: PayMongoApiResponse<T>[];
}

interface CustomerAttributes {
  id: string;
  email: string;
  name: string | null;
  created_at: number;
  updated_at: number;
}

interface PlanAttributes {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  status: string;
  created_at: number;
  updated_at: number;
}

interface SubscriptionAttributes {
  id: string;
  status: string;
  customer_id: string;
  plan: PlanAttributes;
  latest_invoice: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    payment_intent?: {
      id: string;
      status: string;
      next_action?: {
        redirect?: { url: string };
      };
    };
  } | null;
  next_billing_schedule: string | null;
  cancelled_at: number | null;
  created_at: number;
  updated_at: number;
}

// ── Configuration ──────────────────────────────────────────────────────

export const PAYMONGO_API_BASE = "https://api.paymongo.com/v1";

export const PAYMONGO_PLANS = {
  monthly: {
    amount: 45000, // ₱450.00 in centavos
    currency: "php",
    productName: "AgentFlow Pro",
    productDescription:
      "Unlimited leads, unlimited pipelines, custom branding, SMS reminders",
    interval: "month" as const,
    intervalCount: 1,
  },
  annual: {
    amount: 450000, // ₱4,500.00 in centavos (10 months × ₱450)
    currency: "php",
    productName: "AgentFlow Pro (Annual)",
    productDescription:
      "Unlimited leads, unlimited pipelines, custom branding, SMS reminders — 2 months free",
    interval: "year" as const,
    intervalCount: 1,
  },
} as const;

export type PlanInterval = keyof typeof PAYMONGO_PLANS;

// ── Auth Header ────────────────────────────────────────────────────────

function getAuthHeader(): string {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    throw new PayMongoError(
      "PAYMONGO_SECRET_KEY not configured",
      "configuration_error",
      500,
    );
  }
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

// ── API Helpers ────────────────────────────────────────────────────────

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function payMongoFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${PAYMONGO_API_BASE}${path}`;
  const idempotencyKey =
    (options.headers as Record<string, string>)?.["Idempotency-Key"] ||
    crypto.randomUUID();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: getAuthHeader(),
    "Idempotency-Key": idempotencyKey,
    ...((options.headers as Record<string, string>) || {}),
  };

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const errorBody: Record<string, unknown> = await response.json().catch(() => ({}));
        const dataObj = errorBody.data as Record<string, unknown> | undefined;
        const errorAttributes = (dataObj?.attributes as Record<string, unknown>) || undefined;

        // Don't retry client errors (4xx except 429)
        if (!RETRYABLE_STATUS_CODES.has(response.status)) {
          throw new PayMongoError(
            (errorAttributes?.message as string) ||
              `PayMongo API error ${response.status}`,
            (errorAttributes?.code as string) || "api_error",
            response.status,
            errorAttributes,
          );
        }

        // Retryable error — retry after delay
        lastError = new PayMongoError(
          `PayMongo API error ${response.status} (attempt ${attempt + 1})`,
          "retryable_error",
          response.status,
          errorBody as Record<string, unknown>,
        );

        if (attempt < MAX_RETRIES) {
          const delay = Math.min(
            BASE_DELAY_MS * 2 ** attempt + Math.random() * BASE_DELAY_MS,
            10_000,
          );
          await sleep(delay);
          continue;
        }
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof PayMongoError && !RETRYABLE_STATUS_CODES.has(error.statusCode)) {
        throw error;
      }

      lastError = error;

      if (attempt < MAX_RETRIES) {
        const delay = Math.min(
          BASE_DELAY_MS * 2 ** attempt + Math.random() * BASE_DELAY_MS,
          10_000,
        );
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError;
}

// ── Customer Management ────────────────────────────────────────────────

export async function getOrCreatePayMongoCustomer(
  userId: string,
  email: string,
  fullName?: string,
): Promise<string> {
  const supabase = createServiceClient();

  // Check if customer already exists on profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("paymongo_customer_id")
    .eq("id", userId)
    .single();

  if (profile?.paymongo_customer_id) {
    return profile.paymongo_customer_id;
  }

  // Create new PayMongo customer
  const result = await payMongoFetch<PayMongoApiResponse<CustomerAttributes>>(
    "/customers",
    {
      method: "POST",
      body: JSON.stringify({
        data: {
          attributes: {
            email,
            name: fullName || undefined,
          },
        },
      }),
    },
  );

  const customerId = result.data.id;

  // Store on profile
  await supabase
    .from("profiles")
    .update({ paymongo_customer_id: customerId })
    .eq("id", userId);

  return customerId;
}

// ── Plan Management ────────────────────────────────────────────────────

// Cache for plan IDs (created once, reused per interval)
const _planCache: Record<string, string> = {};

async function getOrCreatePlan(interval: PlanInterval): Promise<string> {
  if (_planCache[interval]) return _planCache[interval];

  const config = PAYMONGO_PLANS[interval];

  // Try to find existing plan
  const existing = await payMongoFetch<
    PayMongoListResponse<PlanAttributes>
  >("/plans?limit=100");

  const found = existing.data.find(
    (p) =>
      p.data.attributes.name === config.productName &&
      p.data.attributes.amount === config.amount &&
      p.data.attributes.currency === config.currency &&
      p.data.attributes.interval === config.interval,
  );

  if (found) {
    _planCache[interval] = found.data.id;
    return _planCache[interval];
  }

  // Create new plan
  const result = await payMongoFetch<PayMongoApiResponse<PlanAttributes>>(
    "/plans",
    {
      method: "POST",
      body: JSON.stringify({
        data: {
          attributes: {
            name: config.productName,
            description: config.productDescription,
            amount: config.amount,
            currency: config.currency,
            interval: config.interval,
            interval_count: config.intervalCount,
          },
        },
      }),
    },
  );

  _planCache[interval] = result.data.id;
  return _planCache[interval];
}

// ── Subscription Management ────────────────────────────────────────────

export async function createPayMongoSubscription(
  customerId: string,
  userId: string,
  interval: PlanInterval = "monthly",
): Promise<{ subscriptionId: string; checkoutUrl: string | null }> {
  const supabase = createServiceClient();
  const planId = await getOrCreatePlan(interval);

  const result = await payMongoFetch<
    PayMongoApiResponse<SubscriptionAttributes>
  >("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      data: {
        attributes: {
          customer_id: customerId,
          plan_id: planId,
        },
      },
    }),
  });

  const subscription = result.data;
  const subscriptionId = subscription.id;
  const status = subscription.attributes.status;

  // Store subscription ID + interval on profile
  await supabase
    .from("profiles")
    .update({
      paymongo_subscription_id: subscriptionId,
      subscription_interval: interval,
    })
    .eq("id", userId);

  // If status is incomplete, the first invoice needs payment
  // PayMongo returns a payment_intent with next_action_url for redirect
  let checkoutUrl: string | null = null;
  if (
    status === "incomplete" &&
    subscription.attributes.latest_invoice?.payment_intent
  ) {
    const piId = subscription.attributes.latest_invoice.payment_intent.id;
    const piResult = await payMongoFetch<
      PayMongoApiResponse<{ next_action?: { redirect?: { url: string } } }>
    >(`/payment_intents/${piId}`);
    checkoutUrl =
      piResult.data.attributes.next_action?.redirect?.url || null;
  }

  // If already active (e.g., card vaulted from previous subscription), activate immediately
  if (status === "active") {
    await supabase
      .from("profiles")
      .update({
        plan: "pro",
        subscription_status: "active",
        grace_period_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  return { subscriptionId, checkoutUrl };
}

// ── Cancel Subscription ────────────────────────────────────────────────

export async function cancelPayMongoSubscription(
  subscriptionId: string,
): Promise<void> {
  await payMongoFetch(`/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
  });
}

// ── Webhook Handlers ───────────────────────────────────────────────────

export async function handleSubscriptionActivated(
  subscriptionId: string,
): Promise<void> {
  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("paymongo_subscription_id", subscriptionId)
    .single();

  if (profile) {
    await supabase
      .from("profiles")
      .update({
        plan: "pro",
        subscription_status: "active",
        grace_period_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
  }
}

export async function handleSubscriptionCancelled(
  subscriptionId: string,
): Promise<void> {
  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("paymongo_subscription_id", subscriptionId)
    .single();

  if (profile) {
    await supabase
      .from("profiles")
      .update({
        plan: "free",
        paymongo_subscription_id: null,
        subscription_status: "cancelled",
        grace_period_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
  }
}

export async function handlePaymentFailed(
  subscriptionId: string,
): Promise<void> {
  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, subscription_status")
    .eq("paymongo_subscription_id", subscriptionId)
    .single();

  if (profile) {
    // Don't overwrite if already past_due (idempotent)
    if (profile.subscription_status === "past_due") return;

    // Set 3-day grace period
    const gracePeriodEnds = new Date();
    gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 3);

    await supabase
      .from("profiles")
      .update({
        subscription_status: "past_due",
        grace_period_ends_at: gracePeriodEnds.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
  }
}

export async function handlePaymentPaid(
  subscriptionId: string,
): Promise<void> {
  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, subscription_status")
    .eq("paymongo_subscription_id", subscriptionId)
    .single();

  if (profile && profile.subscription_status === "past_due") {
    // Payment succeeded — clear grace period, restore active status
    await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        grace_period_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
  }
}

// ── Grace Period Expiry (for cron) ─────────────────────────────────────

export async function handleGracePeriodExpired(): Promise<number> {
  const supabase = createServiceClient();

  // Find all profiles past their grace period
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("subscription_status", "past_due")
    .lt("grace_period_ends_at", new Date().toISOString());

  if (!profiles || profiles.length === 0) return 0;

  // Downgrade each to Free
  for (const profile of profiles) {
    await supabase
      .from("profiles")
      .update({
        plan: "free",
        paymongo_subscription_id: null,
        subscription_status: "cancelled",
        grace_period_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
  }

  return profiles.length;
}

// ── Webhook Signature Verification ─────────────────────────────────────

export function verifyWebhookSignature(
  body: string,
  signature: string,
): boolean {
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new PayMongoError(
      "PAYMONGO_WEBHOOK_SECRET not configured",
      "configuration_error",
      500,
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expectedSignature, "utf8"),
    );
  } catch {
    // Length mismatch — signatures don't match
    return false;
  }
}
