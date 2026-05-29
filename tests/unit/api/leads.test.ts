import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase server client
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("next/server", () => ({
  NextRequest: class NextRequest {
    url: string;
    method: string;
    headers: Headers;
    private _body: string;
    constructor(url: string, init?: RequestInit) {
      this.url = url;
      this.method = init?.method || "GET";
      this.headers = new Headers(init?.headers);
      this._body = (init?.body as string) || "";
    }
    async json() {
      return JSON.parse(this._body);
    }
    async text() {
      return this._body;
    }
  },
  NextResponse: {
    json: vi.fn((data, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

import { GET, POST } from "@/app/api/leads/route";
import { NextRequest } from "next/server";

function buildChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => Promise.resolve(result));
  chain.single = vi.fn(() => Promise.resolve(result));
  return chain;
}

describe("/api/leads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 if user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const request = new NextRequest("http://localhost:3000/api/leads");
      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it("returns leads for authenticated user", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: [{ id: "lead-1" }], error: null });
      mockFrom.mockReturnValue(chain);

      const request = new NextRequest("http://localhost:3000/api/leads");
      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it("returns 500 on database error", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: null, error: { message: "DB error" } });
      mockFrom.mockReturnValue(chain);

      const request = new NextRequest("http://localhost:3000/api/leads");
      const response = await GET(request);
      expect(response.status).toBe(500);
    });

    it("queries with correct filters", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const request = new NextRequest("http://localhost:3000/api/leads");
      await GET(request);

      expect(mockFrom).toHaveBeenCalledWith("leads");
      expect(chain.select).toHaveBeenCalledWith("*");
      expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(chain.eq).toHaveBeenCalledWith("is_active", true);
      expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
    });
  });

  describe("POST", () => {
    it("returns 401 if user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const request = new NextRequest("http://localhost:3000/api/leads", {
        method: "POST",
        body: JSON.stringify({ full_name: "John Doe" }),
      });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("creates a new lead with all fields", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: { id: "new-lead", full_name: "John Doe" }, error: null });
      mockFrom.mockReturnValue(chain);

      const request = new NextRequest("http://localhost:3000/api/leads", {
        method: "POST",
        body: JSON.stringify({
          full_name: "John Doe",
          email: "john@example.com",
          phone: "+1234567890",
          source: "referral",
          pipeline_stage: "contacted",
          next_action: "Call back",
          next_action_date: "2026-06-01",
          notes: "Important lead",
        }),
      });
      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it("creates a new lead with default values", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: { id: "new-lead" }, error: null });
      mockFrom.mockReturnValue(chain);

      const request = new NextRequest("http://localhost:3000/api/leads", {
        method: "POST",
        body: JSON.stringify({ full_name: "Jane Doe" }),
      });
      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it("returns 500 on database error", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: null, error: { message: "Insert failed" } });
      mockFrom.mockReturnValue(chain);

      const request = new NextRequest("http://localhost:3000/api/leads", {
        method: "POST",
        body: JSON.stringify({ full_name: "Test" }),
      });
      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    it("sets optional fields to null when not provided", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: {}, error: null });
      mockFrom.mockReturnValue(chain);

      const request = new NextRequest("http://localhost:3000/api/leads", {
        method: "POST",
        body: JSON.stringify({ full_name: "Minimal Lead" }),
      });
      await POST(request);

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          full_name: "Minimal Lead",
          email: null,
          phone: null,
          source: "manual",
          pipeline_stage: "new_lead",
          next_action: null,
          next_action_date: null,
          notes: null,
        })
      );
    });
  });
});
