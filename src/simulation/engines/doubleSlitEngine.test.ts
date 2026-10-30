import { describe, it, expect } from "vitest";
import {
    calculateInterference,
    electronWavelength,
    sampleDetections,
    sourceWavelength,
    type DoubleSlitPoint,
} from "./doubleSlitEngine";

const nearest = (pattern: DoubleSlitPoint[], mm: number) =>
    pattern.reduce((best, p) => (Math.abs(p.position - mm) < Math.abs(best.position - mm) ? p : best));

/** Seeded uniform random numbers, so the sampling tests are repeatable. */
function seeded(seed: number) {
    let a = seed;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

describe("double slit engine: light", () => {
    // Young's slits with a green laser: d = 0.25 mm, a = 0.05 mm, D = 1 m.
    const params = { source: "light", wavelength: 532, slit_spacing: 250, slit_width: 50, screen_distance: 1 };
    const pattern = calculateInterference(params);
    const lambda = 532e-9;

    it("has a bright central fringe and stays within [0, 1]", () => {
        expect(nearest(pattern, 0).intensity).toBeGreaterThan(0.999);
        for (const p of pattern) {
            expect(p.intensity).toBeGreaterThanOrEqual(0);
            expect(p.intensity).toBeLessThanOrEqual(1);
        }
    });

    it("spaces the bright fringes by λ·D/d", () => {
        const spacingMm = ((lambda * 1) / 250e-6) * 1000; // 2.128 mm
        // First dark fringe half a spacing out, next bright fringe one spacing out (a little
        // dimmer under the diffraction envelope).
        expect(nearest(pattern, spacingMm / 2).intensity).toBeLessThan(0.01);
        const envelope = Math.sin((Math.PI * 50e-6 * spacingMm) / 1000 / lambda) / ((Math.PI * 50e-6 * spacingMm) / 1000 / lambda);
        expect(nearest(pattern, spacingMm).intensity).toBeCloseTo(envelope ** 2, 2);
    });

    it("goes dark at the first zero of the single-slit envelope, x = λ·D/a", () => {
        const zeroMm = ((lambda * 1) / 50e-6) * 1000; // 10.64 mm
        expect(nearest(pattern, zeroMm).intensity).toBeLessThan(0.005);
    });

    it("sizes the screen window to the pattern", () => {
        const last = pattern[pattern.length - 1].position;
        expect(pattern[0].position).toBeCloseTo(-last, 9);
        // 1.5 × the envelope half-width: 15.96 mm.
        expect(last).toBeCloseTo(1.5 * ((lambda * 1) / 50e-6) * 1000, 6);
    });
});

describe("double slit engine: electrons", () => {
    it("uses the relativistic de Broglie wavelength", () => {
        // Textbook values: 100 V → 122.6 pm, 50 kV → 5.36 pm.
        expect(electronWavelength(100) * 1e12).toBeCloseTo(122.6, 0);
        expect(electronWavelength(50_000) * 1e12).toBeCloseTo(5.355, 2);
        expect(sourceWavelength({ source: "electron", accelerating_voltage: 50 })).toBeCloseTo(electronWavelength(50_000), 20);
        // The light wavelength is ignored for electrons.
        expect(sourceWavelength({ source: "electron", accelerating_voltage: 50, wavelength: 650 })).toBeLessThan(1e-11);
    });

    it("puts electron fringes λ·D/d apart, micrometres on the screen", () => {
        const params = { source: "electron", accelerating_voltage: 50, slit_spacing: 1, slit_width: 0.2, screen_distance: 1 };
        const pattern = calculateInterference(params);
        const spacingMm = ((electronWavelength(50_000) * 1) / 1e-6) * 1000; // ≈ 0.00536 mm
        expect(nearest(pattern, 0).intensity).toBeGreaterThan(0.999);
        expect(nearest(pattern, spacingMm / 2).intensity).toBeLessThan(0.01);
        // At the first bright fringe the envelope is sinc²(π·a/d) = sinc²(0.2π) ≈ 0.875.
        const u = Math.PI * 0.2;
        expect(nearest(pattern, spacingMm).intensity).toBeCloseTo((Math.sin(u) / u) ** 2, 2);
    });
});

describe("double slit engine: legacy templates", () => {
    it("keeps the old model for `slit_separation` in nm: ideal slits on a 5 cm screen", () => {
        // Saved runs are merged over the registry defaults, which now carry the new keys too.
        const pattern = calculateInterference({ slit_spacing: 250, slit_width: 50, wavelength: 500, slit_separation: 20000, screen_distance: 1 });
        expect(pattern[0].position).toBeCloseTo(-25, 9);
        expect(pattern[pattern.length - 1].position).toBeCloseTo(25, 9);
        const theta = Math.asin(500e-9 / (2 * 20000e-9));
        const xMm = Math.tan(theta) * 1000;
        expect(nearest(pattern, xMm).intensity).toBeLessThan(0.01);
        expect(nearest(pattern, 2 * xMm).intensity).toBeGreaterThan(0.95);
    });
});

describe("sampleDetections", () => {
    const pattern = calculateInterference({ source: "electron", accelerating_voltage: 50, slit_spacing: 1, slit_width: 0.2, screen_distance: 1 });

    it("lands every hit on the screen", () => {
        const hits = sampleDetections(pattern, 2000, seeded(1));
        expect(hits).toHaveLength(2000);
        const min = pattern[0].position;
        const max = pattern[pattern.length - 1].position;
        hits.forEach((x) => {
            expect(x).toBeGreaterThanOrEqual(min);
            expect(x).toBeLessThanOrEqual(max);
        });
    });

    it("follows the intensity: many hits on a bright fringe, almost none on a dark one", () => {
        const hits = sampleDetections(pattern, 20000, seeded(7));
        const spacing = ((electronWavelength(50_000) * 1) / 1e-6) * 1000;
        const band = spacing / 10;
        const near = (centre: number) => hits.filter((x) => Math.abs(x - centre) < band / 2).length;
        const bright = near(0);
        const dark = near(spacing / 2);
        expect(bright).toBeGreaterThan(200);
        expect(dark).toBeLessThan(bright / 20);
    });
});
