import { describe, it, expect, vi } from "vitest";

vi.mock("react", () => ({
    useCallback: (fn) => fn,
}));
vi.mock("@/entities/ExperimentRun", () => ({
    ExperimentRun: { create: vi.fn() },
}));
vi.mock("@/lib/AuthContext", () => ({
    useAuth: () => ({ isAuthenticated: true, navigateToLogin: vi.fn() }),
}));

import {
    serializeSimulationSamples,
    parseStoredSimulationSamples,
} from "./useExperimentPersistence.jsx";
import { calculateFreeFallStep } from "@/components/simulation/engines/freeFallEngine.jsx";

describe("useExperimentPersistence sample serialization (T16)", () => {
    it("flattens nested position.y, strips internal keys, and preserves exact final impact point", () => {
        const params = { h0: 20, v0: -5, g: 9.81, m: 2, c: 0.4 };
        const raw = [];
        for (let t = 0; t <= 10; t += 0.001) {
            const pt = calculateFreeFallStep(Number(t.toFixed(6)), params);
            raw.push(pt);
            if (pt.shouldStop) break;
        }

        const serialized = serializeSimulationSamples(raw, 200);
        expect(serialized.length).toBeLessThanOrEqual(200);
        expect(serialized[0].time).toBe(0);
        expect(typeof serialized[0].position).toBe("number");
        expect(serialized[0].position).toBeCloseTo(20, 5);
        expect(serialized[0].velocity).toBeCloseTo(-5, 5);
        expect(serialized[0]).not.toHaveProperty("shouldStop");

        // Final point is the exact impact point
        const last = serialized[serialized.length - 1];
        expect(last.position).toBe(0);
        expect(last.velocity).toBeLessThan(0);

        // Round-trip through JSON in results_url
        const json = JSON.stringify(serialized);
        const parsed = parseStoredSimulationSamples(json);
        expect(parsed).toEqual(serialized);
    });

    it("returns null from parseStoredSimulationSamples for empty or non-JSON strings", () => {
        expect(parseStoredSimulationSamples(null)).toBeNull();
        expect(parseStoredSimulationSamples("")).toBeNull();
        expect(parseStoredSimulationSamples("https://example.com/data.csv")).toBeNull();
    });
});
