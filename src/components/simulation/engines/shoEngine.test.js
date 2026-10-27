import { describe, it, expect } from "vitest";
import { calculateStep } from "./shoEngine";

const h = 1e-5;

// Checks m·x'' + c·x' + k·x = 0 using finite differences of the engine's own position output,
// so a wrong closed-form solution fails even if acceleration is derived from it.
function expectSatisfiesOde(params, t) {
    const { m, k, c } = params;
    const x = (tt) => calculateStep(tt, params).position;
    const v = (x(t + h) - x(t - h)) / (2 * h);
    const a = (x(t + h) - 2 * x(t) + x(t - h)) / (h * h);
    const residual = m * a + c * v + k * x(t);
    expect(Math.abs(residual)).toBeLessThan(1e-3 * Math.max(1, k * Math.abs(params.x0)));
}

describe("SHO engine (T45)", () => {
    it("matches x0·cos(ω0 t) for an undamped oscillator released at rest", () => {
        const params = { m: 2, k: 8, x0: 0.5, v0: 0, c: 0 };
        const omega0 = Math.sqrt(8 / 2);
        for (const t of [0, 0.3, 1.7, 4.2]) {
            const p = calculateStep(t, params);
            expect(p.position).toBeCloseTo(0.5 * Math.cos(omega0 * t), 10);
            expect(p.energy_total).toBeCloseTo(0.5 * 8 * 0.5 * 0.5, 10);
        }
        expect(calculateStep(0, params).period).toBeCloseTo(2 * Math.PI / omega0, 10);
    });

    it("respects the initial conditions in every damping regime", () => {
        for (const c of [0, 0.5, 20]) {
            const p = calculateStep(0, { m: 1, k: 10, x0: 1, v0: 2, c });
            expect(p.position).toBeCloseTo(1, 8);
            expect(p.velocity).toBeCloseTo(2, 8);
        }
    });

    it("solves the damped equation of motion (underdamped and overdamped)", () => {
        const underdamped = { m: 1, k: 10, x0: 1, v0: 0, c: 0.5 };
        const overdamped = { m: 1, k: 10, x0: 1, v0: 0, c: 20 };
        for (const t of [0.2, 1, 3]) {
            expectSatisfiesOde(underdamped, t);
            expectSatisfiesOde(overdamped, t);
        }
    });

    it("falls back to defaults instead of throwing on null parameters", () => {
        const p = calculateStep(0, { m: null, k: null, x0: null, v0: null });
        expect(p.position).toBe(1);
        expect(p.angular_frequency).toBeCloseTo(Math.sqrt(10), 10);
    });

    it("loses energy monotonically when damped", () => {
        const params = { m: 1, k: 10, x0: 1, v0: 0, c: 0.5 };
        let previous = Infinity;
        for (let t = 0; t <= 5; t += 0.25) {
            const energy = calculateStep(t, params).energy_total;
            expect(energy).toBeLessThanOrEqual(previous + 1e-12);
            previous = energy;
        }
    });
});
