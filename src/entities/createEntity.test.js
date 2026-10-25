import { describe, it, expect, vi, beforeEach } from "vitest";

const supabaseFromMock = vi.hoisted(() => vi.fn());

vi.mock("@/api/supabaseClient", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    supabase: {
      from: supabaseFromMock,
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    },
  };
});

import { createEntity } from "./createEntity.js";
import { resolveSupabaseConfig } from "@/api/supabaseClient";
import {
  readStoredGuestLocale,
  writeStoredGuestLocale,
  GUEST_LOCALE_STORAGE_KEY,
} from "@/lib/AuthContext";

describe("Data layer & guest locale persistence (T46, T56)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createEntity.delete (T56)", () => {
    it("throws when RLS filters out the row and 0 rows are deleted", async () => {
      const selectMock = vi.fn().mockResolvedValue({ data: [], error: null });
      const eqMock = vi.fn().mockReturnValue({ select: selectMock });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
      supabaseFromMock.mockReturnValue({ delete: deleteMock });

      const onChange = vi.fn();
      const entity = createEntity("experiment_runs", { onChange });

      await expect(entity.delete("run-123")).rejects.toThrow(/not found or access was denied/i);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("returns the deleted row and calls onChange when 1 row is deleted", async () => {
      const selectMock = vi.fn().mockResolvedValue({ data: [{ id: "run-123" }], error: null });
      const eqMock = vi.fn().mockReturnValue({ select: selectMock });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
      supabaseFromMock.mockReturnValue({ delete: deleteMock });

      const onChange = vi.fn();
      const entity = createEntity("experiment_runs", { onChange });

      const result = await entity.delete("run-123");
      expect(result).toEqual({ id: "run-123" });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("resolveSupabaseConfig (T56)", () => {
    it("throws a clear error when VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing", () => {
      expect(() => resolveSupabaseConfig({})).toThrow(/Missing VITE_SUPABASE_URL/i);
      expect(() => resolveSupabaseConfig({ VITE_SUPABASE_URL: "https://x.supabase.co" })).toThrow(
        /Missing VITE_SUPABASE_URL/i
      );
    });

    it("returns url and anonKey when both are provided", () => {
      expect(
        resolveSupabaseConfig({
          VITE_SUPABASE_URL: "https://x.supabase.co",
          VITE_SUPABASE_ANON_KEY: "anon-123",
        })
      ).toEqual({
        supabaseUrl: "https://x.supabase.co",
        supabaseAnonKey: "anon-123",
      });
    });
  });

  describe("guest locale persistence (T46)", () => {
    it("persists and restores 'en' and 'he' in storage", () => {
      const store = new Map();
      const mockStorage = {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => store.set(k, v),
        removeItem: (k) => store.delete(k),
      };

      expect(readStoredGuestLocale(mockStorage)).toBeNull();
      writeStoredGuestLocale("en", mockStorage);
      expect(store.get(GUEST_LOCALE_STORAGE_KEY)).toBe("en");
      expect(readStoredGuestLocale(mockStorage)).toBe("en");

      writeStoredGuestLocale("he", mockStorage);
      expect(readStoredGuestLocale(mockStorage)).toBe("he");
    });
  });
});
