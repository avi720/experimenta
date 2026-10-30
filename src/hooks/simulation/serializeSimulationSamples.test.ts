import { describe, it, expect, vi } from "vitest";

vi.mock("sonner", () => ({ toast: {} }));
vi.mock("@/hooks/useDataQueries", () => ({ useExperimentRunMutations: () => ({}) }));
vi.mock("@/lib/AuthContext", () => ({ useAuth: () => ({}), AuthContext: {} }));

import { serializeSimulationSamples } from "./useExperimentPersistence";

describe("serializeSimulationSamples with non-object points", () => {
    it("skips null and primitive points so every stored sample is an object", () => {
        const serialized = serializeSimulationSamples([
            { time: 0, position: { y: 1 } },
            null,
            42,
            { time: 0.1, position: 2 },
        ]);

        expect(serialized).toEqual([
            { time: 0, position: 1 },
            { time: 0.1, position: 2 },
        ]);
        expect(serialized.every((sample) => typeof sample === "object" && sample !== null)).toBe(true);
    });

    it("keeps a null measurement so the column exists before the wave collapses", () => {
        const serialized = serializeSimulationSamples([
            { time: 0, transmission: 0.4, hasCollapsed: false, measurementResult: null },
            { time: 1, transmission: 0.4, hasCollapsed: true, measurementResult: "transmitted" },
        ]);

        expect(serialized[0].measurementResult).toBeNull();
        expect(Object.keys(serialized[0])).toContain("measurementResult");
        expect(serialized[1].measurementResult).toBe("transmitted");
    });
});
