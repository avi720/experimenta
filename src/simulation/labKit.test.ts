import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { createRuler, niceStep, wavelengthToRgb } from "./labKit";

describe("labKit", () => {
    it("picks 1-2-5 steps", () => {
        expect(niceStep(50, 8)).toBe(5);
        expect(niceStep(500, 8)).toBe(50);
        expect(niceStep(1, 8)).toBe(0.1);
        expect(niceStep(120, 8)).toBe(10);
    });

    it("maps wavelengths to their spectral colour", () => {
        expect(wavelengthToRgb(650)).toEqual([1, 0, 0]);
        expect(wavelengthToRgb(530)[1]).toBe(1);
        expect(wavelengthToRgb(450)[2]).toBe(1);
        expect(wavelengthToRgb(300)).toEqual([0, 0, 0]);
    });

    it("draws one tick per minor step in a single instanced mesh", () => {
        const ruler = createRuler({
            min: -5, max: 5, scale: 12, minorStep: 0.1, majorStep: 0.5, labelStep: 1,
            format: String, tickSize: 1,
        });
        const ticks = ruler.children.find((c) => c instanceof THREE.InstancedMesh) as THREE.InstancedMesh;
        expect(ticks.count).toBe(101);
    });
});
