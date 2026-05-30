import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(function MockResend() {
    return { emails: { send: mockSend } };
  }),
}));

describe("Resend Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("exports EMAIL_CONFIG with correct values", async () => {
    const { EMAIL_CONFIG } = await import("@/lib/resend");
    expect(EMAIL_CONFIG.from).toBe("AgentFlow <daily@agentflow.app>");
    expect(EMAIL_CONFIG.appName).toBe("AgentFlow");
  });

  it("sendDailyDigest returns success on success", async () => {
    mockSend.mockResolvedValue({ error: null });
    const { sendDailyDigest } = await import("@/lib/resend");
    const result = await sendDailyDigest("test@example.com", "John", [
      { full_name: "Lead 1", next_action: "Call", next_action_date: "2026-06-01" },
    ]);
    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("sendDailyDigest returns error on failure", async () => {
    mockSend.mockRejectedValue(new Error("Send failed"));
    const { sendDailyDigest } = await import("@/lib/resend");
    const result = await sendDailyDigest("test@example.com", "John", [
      { full_name: "Lead 1", next_action: "Call", next_action_date: "2026-06-01" },
    ]);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Send failed");
  });

  it("sendWelcomeEmail returns success on success", async () => {
    mockSend.mockResolvedValue({ error: null });
    const { sendWelcomeEmail } = await import("@/lib/resend");
    const result = await sendWelcomeEmail("test@example.com", "John");
    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("sendWelcomeEmail returns error on failure", async () => {
    mockSend.mockRejectedValue(new Error("Send failed"));
    const { sendWelcomeEmail } = await import("@/lib/resend");
    const result = await sendWelcomeEmail("test@example.com", "John");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Send failed");
  });

  it("sendDailyDigest includes correct subject for single lead", async () => {
    mockSend.mockResolvedValue({ error: null });
    const { sendDailyDigest } = await import("@/lib/resend");
    await sendDailyDigest("test@example.com", "John", [
      { full_name: "Lead 1", next_action: "Call", next_action_date: "2026-06-01" },
    ]);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "1 follow-up due today" })
    );
  });

  it("sendDailyDigest includes correct subject for multiple leads", async () => {
    mockSend.mockResolvedValue({ error: null });
    const { sendDailyDigest } = await import("@/lib/resend");
    await sendDailyDigest("test@example.com", "John", [
      { full_name: "Lead 1", next_action: "Call", next_action_date: "2026-06-01" },
      { full_name: "Lead 2", next_action: "Email", next_action_date: "2026-06-02" },
    ]);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "2 follow-ups due today" })
    );
  });
});
