import { describe, it, expect, vi } from "vitest";

vi.mock("./scenes/FreeFallScene", () => ({ default: () => null }));
vi.mock("./scenes/ShoScene", () => ({ default: () => null }));
vi.mock("./scenes/QuantumTunnelingScene", () => ({ default: () => null }));
vi.mock("./scenes/DoubleSlitScene", () => ({ default: () => null }));

import {
    EXPERIMENT_REGISTRY,
    resolveExperimentRegistryEntry,
    getExperimentWorkspaceUrl,
} from "./experimentRegistry.js";

describe("experimentRegistry (T18)", () => {
    it("registers all 4 built-in experiments with engines, scenes, and defaultMaxTime", () => {
        expect(Object.keys(EXPERIMENT_REGISTRY)).toEqual([
            "freeFall",
            "sho",
            "quantumTunneling",
            "doubleSlit",
        ]);

        expect(EXPERIMENT_REGISTRY.freeFall.mode).toBe("time");
        expect(EXPERIMENT_REGISTRY.freeFall.defaultMaxTime).toBe(60);
        expect(typeof EXPERIMENT_REGISTRY.freeFall.calculateStepFn).toBe("function");

        expect(EXPERIMENT_REGISTRY.sho.mode).toBe("time");
        expect(typeof EXPERIMENT_REGISTRY.sho.calculateStepFn).toBe("function");

        expect(EXPERIMENT_REGISTRY.quantumTunneling.mode).toBe("time");
        expect(typeof EXPERIMENT_REGISTRY.quantumTunneling.calculateStepFn).toBe("function");

        expect(EXPERIMENT_REGISTRY.doubleSlit.mode).toBe("static");
        expect(typeof EXPERIMENT_REGISTRY.doubleSlit.calculateStaticFn).toBe("function");
    });

    it("resolves experiments by slug, engine key, or legacy page name", () => {
        expect(
            resolveExperimentRegistryEntry({ slug: "free-fall" })?.slug
        ).toBe("free-fall");
        expect(
            resolveExperimentRegistryEntry({ engine: "quantumTunneling" })?.slug
        ).toBe("quantum-tunneling");
        expect(resolveExperimentRegistryEntry("ShoExperiment")?.slug).toBe("sho");
        expect(
            resolveExperimentRegistryEntry("DoubleSlitExperiment")?.slug
        ).toBe("double-slit");
    });

    it("builds canonical workspace URLs", () => {
        expect(getExperimentWorkspaceUrl("free-fall")).toBe(
            "/LabWorkspace?id=free-fall"
        );
        expect(getExperimentWorkspaceUrl("")).toBe("/Lab");
    });
});
