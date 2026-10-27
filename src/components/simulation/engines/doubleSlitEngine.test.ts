import { describe, it, expect } from "vitest";
import { calculateInterference } from "./doubleSlitEngine";

describe("double slit engine (T45)", () => {
    const params = { wavelength: 500, slit_separation: 2000, screen_distance: 1 };
    const pattern = calculateInterference(params);
    const intensityAt = (mm: number) =>
        pattern.reduce((best, p) =>
            Math.abs(p.position - mm) < Math.abs(best.position - mm) ? p : best
        ).intensity;

    it("has a bright central fringe and stays within [0, 1]", () => {
        expect(intensityAt(0)).toBeGreaterThan(0.99);
        for (const p of pattern) {
            expect(p.intensity).toBeGreaterThanOrEqual(0);
            expect(p.intensity).toBeLessThanOrEqual(1);
        }
    });

    it("places the first dark fringe where d·sinθ = λ/2", () => {
        // With d = 20 µm the first minimum (~12.5 mm) falls on the 50 mm screen.
        const wide = calculateInterference({ wavelength: 500, slit_separation: 20000, screen_distance: 1 });
        const wideIntensityAt = (mm: number) =>
            wide.reduce((best, p) =>
                Math.abs(p.position - mm) < Math.abs(best.position - mm) ? p : best
            ).intensity;
        const lambda = 500e-9;
        const d = 20000e-9;
        const theta = Math.asin(lambda / (2 * d));
        const xMm = Math.tan(theta) * 1 * 1000;
        expect(wideIntensityAt(xMm)).toBeLessThan(0.01);
        expect(wideIntensityAt(2 * xMm)).toBeGreaterThan(0.95);
    });
});
