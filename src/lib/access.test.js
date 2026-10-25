import { describe, it, expect } from "vitest";
import { canAccessExperiment } from "./access";

describe("canAccessExperiment (T39)", () => {
    it("allows everyone to access public experiments", () => {
        expect(canAccessExperiment(null, { access_level: "public" })).toBe(true);
        expect(canAccessExperiment({ role: "user" }, { access_level: "public" })).toBe(true);
    });

    it("requires a signed-in user for registered experiments", () => {
        expect(canAccessExperiment(null, { access_level: "registered" })).toBe(false);
        expect(canAccessExperiment({ id: "u1", role: "user" }, { access_level: "registered" })).toBe(true);
    });

    it("requires premium subscription or admin role for premium experiments", () => {
        expect(canAccessExperiment(null, { access_level: "premium" })).toBe(false);
        expect(
            canAccessExperiment(
                { id: "u1", role: "user", subscription_tier: "free" },
                { access_level: "premium" }
            )
        ).toBe(false);
        expect(
            canAccessExperiment(
                { id: "u1", role: "user", subscription_tier: "premium" },
                { access_level: "premium" }
            )
        ).toBe(true);
        expect(
            canAccessExperiment(
                { id: "a1", role: "admin", subscription_tier: "free" },
                { access_level: "premium" }
            )
        ).toBe(true);
    });
});
