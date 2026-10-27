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
});
