import { describe, it, expect } from "vitest";
import {
    getSampleDt,
    sampleIndexAtTime,
    MAX_SAMPLES,
    MIN_SAMPLE_DT,
} from "./useSimulationEngineLogic";

describe("simulation sampling (T24)", () => {
    it("bounds a 60 s run to at most MAX_SAMPLES grid points that never pass t_max", () => {
        const tMax = 60;
        const dt = getSampleDt(tMax);
        const lastStep = Math.floor(tMax / dt + 1e-9);
        expect(lastStep + 1).toBeLessThanOrEqual(MAX_SAMPLES);
        expect(lastStep * dt).toBeLessThanOrEqual(tMax + 1e-9);
    });

    it("rounds the interval up to a readable 1-2-5 step", () => {
        expect(getSampleDt(20)).toBe(0.005);
        expect(getSampleDt(60)).toBe(0.02);
    });

    it("keeps 1 ms resolution for short runs", () => {
        expect(getSampleDt(2)).toBe(MIN_SAMPLE_DT);
        expect(getSampleDt(0)).toBe(MIN_SAMPLE_DT);
    });

    it("finds the nearest sample in O(1) and clamps to the available range", () => {
        const dt = 0.01;
        expect(sampleIndexAtTime(0, dt, 100)).toBe(0);
        expect(sampleIndexAtTime(0.026, dt, 100)).toBe(3);
        expect(sampleIndexAtTime(-1, dt, 100)).toBe(0);
        expect(sampleIndexAtTime(50, dt, 100)).toBe(99);
        expect(sampleIndexAtTime(1, dt, 0)).toBe(-1);
    });
});
