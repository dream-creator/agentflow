import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn()", () => {
  it("returns a single class name unchanged", () => {
    expect(cn("px-4")).toBe("px-4");
  });

  it("merges multiple class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles undefined and null inputs", () => {
    expect(cn(undefined, null, "text-sm")).toBe("text-sm");
  });

  it("handles falsy values", () => {
    expect(cn(false, 0, "", "text-sm")).toBe("text-sm");
  });

  it("resolves Tailwind conflicts — later wins", () => {
    expect(cn("px-4", "px-8")).toBe("px-8");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("handles conditional classes via clsx", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active"
    );
  });

  it("handles arrays of classes", () => {
    expect(cn(["px-4", "py-2"], "text-sm")).toBe("px-4 py-2 text-sm");
  });

  it("handles object syntax via clsx", () => {
    expect(cn({ "px-4": true, "px-8": false })).toBe("px-4");
  });

  it("deduplicates non-conflicting classes", () => {
    const result = cn("text-sm", "font-bold", "text-red-500");
    expect(result).toContain("text-sm");
    expect(result).toContain("font-bold");
    expect(result).toContain("text-red-500");
  });

  it("handles empty strings gracefully", () => {
    expect(cn("", "", "text-sm")).toBe("text-sm");
  });

  it("resolves conflicting flex direction classes", () => {
    const result = cn("flex items-center", "flex-col justify-center");
    expect(result).toContain("flex-col");
    expect(result).toContain("items-center");
    expect(result).toContain("justify-center");
  });
});
