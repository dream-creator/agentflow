import { describe, it, expect } from "vitest";
import Papa from "papaparse";

function sanitizeCSVValue(value: string): string {
  if (!value) return value;
  if (/^[=+\-@\t\r]/.test(value)) {
    return "'" + value;
  }
  return value;
}

function isBinaryContent(text: string): boolean {
  const nullCount = (text.match(/\0/g) || []).length;
  return nullCount > 0 || (text.length > 0 && nullCount / text.length > 0.01);
}

describe("CSV Import Utilities", () => {
  describe("sanitizeCSVValue", () => {
    it("passes through normal text", () => {
      expect(sanitizeCSVValue("John Smith")).toBe("John Smith");
    });

    it("prefixes formula injection with single quote", () => {
      expect(sanitizeCSVValue('=CMD("calc")')).toBe("'=CMD(\"calc\")");
      expect(sanitizeCSVValue("+SUM(A1:A10)")).toBe("'+SUM(A1:A10)");
      expect(sanitizeCSVValue("-1+1")).toBe("'-1+1");
      expect(sanitizeCSVValue("@SUM(1)")).toBe("'@SUM(1)");
    });

    it("handles tab and carriage return", () => {
      expect(sanitizeCSVValue("\tformula")).toBe("'\tformula");
      expect(sanitizeCSVValue("\rformula")).toBe("'\rformula");
    });

    it("passes through empty strings", () => {
      expect(sanitizeCSVValue("")).toBe("");
    });
  });

  describe("isBinaryContent", () => {
    it("accepts normal CSV text", () => {
      expect(isBinaryContent("name,email\nJohn,john@test.com")).toBe(false);
    });

    it("rejects content with null bytes", () => {
      expect(isBinaryContent("name\0email")).toBe(true);
    });
  });

  describe("papaparse parsing", () => {
    it("parses simple CSV", () => {
      const csv = "name,email,phone\nJohn,john@test.com,555-0123\nJane,jane@test.com,555-0456";
      const result = Papa.parse(csv, { header: true, skipEmptyLines: true });
      expect(result.errors).toHaveLength(0);
      expect(result.data).toHaveLength(2);
      expect((result.data[0] as Record<string, string>).name).toBe("John");
    });

    it("handles quoted fields with commas", () => {
      const csv = 'name,email\n"Smith, Jr.",john@test.com';
      const result = Papa.parse(csv, { header: true, skipEmptyLines: true });
      expect(result.errors).toHaveLength(0);
      expect((result.data[0] as Record<string, string>).name).toBe("Smith, Jr.");
    });

    it("handles empty lines", () => {
      const csv = "name,email\nJohn,john@test.com\n\nJane,jane@test.com\n";
      const result = Papa.parse(csv, { header: true, skipEmptyLines: true });
      expect(result.data).toHaveLength(2);
    });

    it("handles semicolon delimiter", () => {
      const csv = "name;email\nJohn;john@test.com";
      const result = Papa.parse(csv, { header: true, skipEmptyLines: true, delimiter: ";" });
      expect(result.data).toHaveLength(1);
      expect((result.data[0] as Record<string, string>).name).toBe("John");
    });
  });
});
