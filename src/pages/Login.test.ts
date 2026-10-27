import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));
vi.mock("@/entities/User", () => ({
  User: {},
}));
vi.mock("@/lib/AuthContext", () => ({
  useAuth: () => ({}),
}));
vi.mock("@/hooks/useAppData", () => ({
  useAppData: () => ({ isRTL: true }),
}));

import { localizeAuthError } from "./Login";

describe("localizeAuthError (T57)", () => {
  it("translates common Supabase Auth errors into Hebrew and English", () => {
    expect(localizeAuthError(new Error("Invalid login credentials"), true)).toBe(
      "אימייל או סיסמה שגויים"
    );
    expect(localizeAuthError(new Error("Invalid login credentials"), false)).toBe(
      "Invalid email or password"
    );

    expect(localizeAuthError(new Error("Email not confirmed"), true)).toContain("האימייל טרם אומת");
    expect(localizeAuthError(new Error("User already registered"), true)).toContain("כבר רשום");
    expect(localizeAuthError(new Error("Email rate limit exceeded"), true)).toContain("יותר מדי ניסיונות");
    expect(localizeAuthError(new Error("Email rate limit exceeded"), false)).toContain("Too many attempts");
  });
});
