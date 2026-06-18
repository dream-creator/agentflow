import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import type { PayMongoError as PayMongoErrorType } from "@/lib/paymongo";

// ── PayMongoError ──────────────────────────────────────────────

describe("PayMongoError", () => {
  it("is instance of Error", async () => {
    const { PayMongoError } = await import("@/lib/paymongo");
    const err = new PayMongoError("msg", "code", 400);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PayMongoError);
  });

  it("stores message, code, statusCode, and details", async () => {
    const { PayMongoError } = await import("@/lib/paymongo");
    const details = { field: "email" };
    const err = new PayMongoError("bad request", "bad_request", 422, details);
    expect(err.message).toBe("bad request");
    expect(err.code).toBe("bad_request");
    expect(err.statusCode).toBe(422);
    expect(err.details).toBe(details);
  });

  it("name is PayMongoError", async () => {
    const { PayMongoError } = await import("@/lib/paymongo");
    const err = new PayMongoError("x", "y", 500);
    expect(err.name).toBe("PayMongoError");
  });

  it("details is optional", async () => {
    const { PayMongoError } = await import("@/lib/paymongo");
    const err = new PayMongoError("msg", "code", 400);
    expect(err.details).toBeUndefined();
  });
});

// ── PAYMONGO_PLANS ─────────────────────────────────────────────

describe("PAYMONGO_PLANS", () => {
  it("has monthly and annual plans with correct amounts", async () => {
    const { PAYMONGO_PLANS } = await import("@/lib/paymongo");
    expect(PAYMONGO_PLANS.monthly.amount).toBe(45000);
    expect(PAYMONGO_PLANS.monthly.currency).toBe("php");
    expect(PAYMONGO_PLANS.monthly.interval).toBe("month");
    expect(PAYMONGO_PLANS.monthly.intervalCount).toBe(1);

    expect(PAYMONGO_PLANS.annual.amount).toBe(450000);
    expect(PAYMONGO_PLANS.annual.currency).toBe("php");
    expect(PAYMONGO_PLANS.annual.interval).toBe("year");
    expect(PAYMONGO_PLANS.annual.intervalCount).toBe(1);
  });

  it("monthly is cheaper than annual total", async () => {
    const { PAYMONGO_PLANS } = await import("@/lib/paymongo");
    // Annual = 10x monthly (2 months free)
    expect(PAYMONGO_PLANS.annual.amount).toBe(PAYMONGO_PLANS.monthly.amount * 10);
  });

  it("both use PHP currency", async () => {
    const { PAYMONGO_PLANS } = await import("@/lib/paymongo");
    expect(PAYMONGO_PLANS.monthly.currency).toBe("php");
    expect(PAYMONGO_PLANS.annual.currency).toBe("php");
  });
});

// ── verifyWebhookSignature ─────────────────────────────────────

describe("verifyWebhookSignature", () => {
  beforeEach(() => {
    process.env.PAYMONGO_WEBHOOK_SECRET = "test_webhook_secret";
  });

  it("returns true for valid HMAC-SHA256 signature", async () => {
    const { verifyWebhookSignature } = await import("@/lib/paymongo");
    const payload = '{"event":"subscription.activated","data":{}}';
    const signature = createHmac("sha256", "test_webhook_secret")
      .update(payload)
      .digest("hex");

    const result = verifyWebhookSignature(payload, signature);
    expect(result).toBe(true);
  });

  it("returns false for invalid signature", async () => {
    const { verifyWebhookSignature } = await import("@/lib/paymongo");
    const result = verifyWebhookSignature(
      '{"event":"test"}',
      "a".repeat(64), // valid hex length but wrong signature
    );
    expect(result).toBe(false);
  });

  it("returns false for wrong secret", async () => {
    const { verifyWebhookSignature } = await import("@/lib/paymongo");
    const payload = '{"event":"test"}';
    const signature = createHmac("sha256", "wrong_secret")
      .update(payload)
      .digest("hex");

    const result = verifyWebhookSignature(payload, signature);
    expect(result).toBe(false);
  });

  it("returns false for empty signature (length mismatch)", async () => {
    const { verifyWebhookSignature } = await import("@/lib/paymongo");
    const result = verifyWebhookSignature("payload", "");
    expect(result).toBe(false);
  });

  it("throws PayMongoError when PAYMONGO_WEBHOOK_SECRET is not set", async () => {
    delete process.env.PAYMONGO_WEBHOOK_SECRET;
    const { verifyWebhookSignature, PayMongoError } = await import("@/lib/paymongo");
    expect(() => verifyWebhookSignature("body", "sig")).toThrow(PayMongoError);
  });

  it("throws with configuration_error code when secret missing", async () => {
    delete process.env.PAYMONGO_WEBHOOK_SECRET;
    const { verifyWebhookSignature, PayMongoError } = await import("@/lib/paymongo");
    try {
      verifyWebhookSignature("body", "sig");
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(PayMongoError);
      expect((e as PayMongoErrorType).code).toBe("configuration_error");
    }
  });
});
