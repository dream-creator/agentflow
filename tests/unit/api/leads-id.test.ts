import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

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
    private _body: string;
    constructor(url: string, init?: RequestInit) {
      this.url = url;
      this.method = init?.method || "GET";
      this._body = (init?.body as string) || "";
    }
    async json() { return JSON.parse(this._body); }
  },
  NextResponse: {
    json: vi.fn((data: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

import { GET, PUT, DELETE } from "@/app/api/leads/[id]/route";
import { NextRequest } from "next/server";

const mockParams = { params: Promise.resolve({ id: "lead-123" }) };

function buildChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  return chain;
}

describe("/api/leads/[id]", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("GET", () => {
    it("returns 401 if user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const request = new NextRequest("http://localhost:3000/api/leads/lead-123");
      const response = await GET(request, mockParams);
      expect(response.status).toBe(401);
    });

    it("returns lead by id", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: { id: "lead-123" }, error: null });
      mockFrom.mockReturnValue(chain);
      const request = new NextRequest("http://localhost:3000/api/leads/lead-123");
      const response = await GET(request, mockParams);
      expect(response.status).toBe(200);
    });

    it("returns 500 on database error", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: null, error: { message: "Not found" } });
      mockFrom.mockReturnValue(chain);
      const request = new NextRequest("http://localhost:3000/api/leads/lead-123");
      const response = await GET(request, mockParams);
      expect(response.status).toBe(500);
    });

    it("queries with correct id and user_id", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: {}, error: null });
      mockFrom.mockReturnValue(chain);
      const request = new NextRequest("http://localhost:3000/api/leads/lead-123");
      await GET(request, mockParams);
      expect(chain.eq).toHaveBeenCalledWith("id", "lead-123");
      expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
    });
  });

  describe("PUT", () => {
    it("returns 401 if user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const request = new NextRequest("http://localhost:3000/api/leads/lead-123", {
        method: "PUT", body: JSON.stringify({ full_name: "Updated" }),
      });
      const response = await PUT(request, mockParams);
      expect(response.status).toBe(401);
    });

    it("updates lead successfully", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: { id: "lead-123" }, error: null });
      mockFrom.mockReturnValue(chain);
      const request = new NextRequest("http://localhost:3000/api/leads/lead-123", {
        method: "PUT", body: JSON.stringify({ full_name: "Updated" }),
      });
      const response = await PUT(request, mockParams);
      expect(response.status).toBe(200);
    });

    it("returns 500 on database error", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: null, error: { message: "Update failed" } });
      mockFrom.mockReturnValue(chain);
      const request = new NextRequest("http://localhost:3000/api/leads/lead-123", {
        method: "PUT", body: JSON.stringify({ full_name: "Fail" }),
      });
      const response = await PUT(request, mockParams);
      expect(response.status).toBe(500);
    });

    it("adds updated_at timestamp", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: {}, error: null });
      mockFrom.mockReturnValue(chain);
      const request = new NextRequest("http://localhost:3000/api/leads/lead-123", {
        method: "PUT", body: JSON.stringify({ full_name: "Test" }),
      });
      await PUT(request, mockParams);
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ updated_at: expect.any(String) })
      );
    });
  });

  describe("DELETE", () => {
    it("returns 401 if user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const request = new NextRequest("http://localhost:3000/api/leads/lead-123", { method: "DELETE" });
      const response = await DELETE(request, mockParams);
      expect(response.status).toBe(401);
    });

    it("deletes lead successfully", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);
      const request = new NextRequest("http://localhost:3000/api/leads/lead-123", { method: "DELETE" });
      const response = await DELETE(request, mockParams);
      expect(response.status).toBe(200);
    });

    it("returns 500 on database error", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const deleteChain = { eq: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: { message: "Delete failed" } })) })) };
      mockFrom.mockReturnValue({ delete: vi.fn(() => deleteChain) });
      const request = new NextRequest("http://localhost:3000/api/leads/lead-123", { method: "DELETE" });
      const response = await DELETE(request, mockParams);
      expect(response.status).toBe(500);
    });

    it("deletes with correct id and user_id", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);
      const request = new NextRequest("http://localhost:3000/api/leads/lead-123", { method: "DELETE" });
      await DELETE(request, mockParams);
      expect(chain.eq).toHaveBeenCalledWith("id", "lead-123");
      expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
    });

    it("returns success true on delete", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const chain = buildChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);
      const request = new NextRequest("http://localhost:3000/api/leads/lead-123", { method: "DELETE" });
      const response = await DELETE(request, mockParams);
      const body = await response.json();
      expect(body).toEqual({ success: true });
    });
  });
});
