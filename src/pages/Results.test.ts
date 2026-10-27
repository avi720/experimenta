import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

import {
  parseRunParameters,
  formatDisplayValue,
  filterRunsByCriteria,
} from "@/components/pagesComponents/results/resultsDomain";

describe("Results helpers (T40, T58)", () => {
  describe("parseRunParameters (T58)", () => {
    it("parses valid JSON parameter objects", () => {
      const res = parseRunParameters('{"h0":50,"v0":0,"c":0.5}');
      expect(res.error).toBeNull();
      expect(res.parameters).toEqual({ h0: 50, v0: 0, c: 0.5 });
    });

    it("returns empty parameters with no error for empty/null input", () => {
      expect(parseRunParameters("")).toEqual({ parameters: {}, error: null });
      expect(parseRunParameters(null)).toEqual({ parameters: {}, error: null });
      expect(parseRunParameters(undefined)).toEqual({ parameters: {}, error: null });
    });

    it("returns malformed_parameters_json error without throwing on invalid JSON or non-object JSON", () => {
      expect(parseRunParameters("{broken json")).toEqual({
        parameters: {},
        error: "malformed_parameters_json",
      });
      expect(parseRunParameters("[1,2,3]")).toEqual({
        parameters: {},
        error: "malformed_parameters_json",
      });
      expect(parseRunParameters('"just a string"')).toEqual({
        parameters: {},
        error: "malformed_parameters_json",
      });
    });
  });

  describe("formatDisplayValue (T58)", () => {
    it("formats numbers to fixed precision and stringifies objects safely", () => {
      expect(formatDisplayValue(12.34567, 3)).toBe("12.346");
      expect(formatDisplayValue({ y: 10 })).toBe('{"y":10}');
      expect(formatDisplayValue(null)).toBe("");
      expect(formatDisplayValue(undefined)).toBe("");
      expect(formatDisplayValue("abc")).toBe("abc");
    });
  });

  describe("filterRunsByCriteria (T40)", () => {
    const now = new Date("2026-10-25T15:00:00Z");
    const runs = [
      { id: "1", experiment_slug: "free-fall", created_date: "2026-10-25T10:00:00Z" },
      { id: "2", experiment_slug: "sho", created_date: "2026-10-22T10:00:00Z" },
      { id: "3", experiment_slug: "free-fall", created_date: "2026-10-05T10:00:00Z" },
      { id: "4", experiment_slug: "free-fall", created_date: "2026-08-01T10:00:00Z" },
    ];

    it("filters by experiment slug", () => {
      const res = filterRunsByCriteria(runs, { experiment: "sho", dateRange: "all" }, now);
      expect(res.map((r) => r.id)).toEqual(["2"]);
    });

    it("filters by today, week, and month", () => {
      expect(
        filterRunsByCriteria(runs, { experiment: "all", dateRange: "today" }, now).map((r) => r.id)
      ).toEqual(["1"]);
      expect(
        filterRunsByCriteria(runs, { experiment: "all", dateRange: "week" }, now).map((r) => r.id)
      ).toEqual(["1", "2"]);
      expect(
        filterRunsByCriteria(runs, { experiment: "all", dateRange: "month" }, now).map((r) => r.id)
      ).toEqual(["1", "2", "3"]);
    });
  });
});
