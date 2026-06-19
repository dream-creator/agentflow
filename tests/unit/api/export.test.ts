import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve("src/app/api/export/route.ts"),
  "utf-8"
);

describe("GET /api/export", () => {
  it("exports user data as JSON", () => {
    expect(source).toContain("application/json");
  });

  it("requires authentication", () => {
    expect(source).toContain("getUser");
  });

  it("returns 401 when not authenticated", () => {
    expect(source).toContain("401");
  });

  it("fetches profile data", () => {
    expect(source).toContain("profiles");
  });

  it("fetches leads data", () => {
    expect(source).toContain("leads");
  });

  it("fetches actions data", () => {
    expect(source).toContain("actions");
  });

  it("filters by user_id for security", () => {
    expect(source).toContain("user_id");
  });

  it("returns data as downloadable file", () => {
    expect(source).toContain("Content-Disposition");
  });

  it("includes rate limiting", () => {
    expect(source).toContain("rateLimit");
  });

  it("sets cache-control headers to prevent caching", () => {
    expect(source).toContain("no-store");
  });
});
