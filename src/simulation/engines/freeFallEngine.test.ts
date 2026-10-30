import { describe, expect, it } from 'vitest';
import { calculateFreeFallStep } from './freeFallEngine';
import type { EngineParameters } from './types';

const DT = 0.001; // same fixed step as the simulation engine loop

/** Runs the step function the way the simulation loop does and returns every point. */
function runToImpact(params: EngineParameters, maxTime = 120) {
    const points: ReturnType<typeof calculateFreeFallStep>[] = [];
    for (let step = 0; step * DT <= maxTime; step++) {
        const point = calculateFreeFallStep(step * DT, params);
        points.push(point);
        if (point.shouldStop) break;
    }
    return points;
}

describe('free fall engine (T15)', () => {
    for (const c of [0, 0.5, 1]) {
        it(`reports acceleration equal to dv/dt for drag c = ${c}`, () => {
            // High drop so no sample time below reaches the ground
            const params = { h0: 2000, v0: 3, g: 9.81, m: 2, c };
            const h = 1e-5;
            for (const t of [0.1, 0.5, 1, 2, 5, 10]) {
                const point = calculateFreeFallStep(t, params);
                const numericDerivative =
                    (calculateFreeFallStep(t + h, params).velocity - calculateFreeFallStep(t - h, params).velocity) / (2 * h);
                expect(point.shouldStop).toBe(false);
                expect(Math.abs(point.acceleration - numericDerivative)).toBeLessThan(1e-3);
            }
        });

        it(`drag opposes motion for c = ${c} (acceleration magnitude never exceeds g while falling)`, () => {
            const params = { h0: 2000, v0: 0, g: 9.81, m: 1, c };
            for (const t of [0.5, 2, 5]) {
                const { acceleration } = calculateFreeFallStep(t, params);
                expect(acceleration).toBeLessThan(0);
                expect(Math.abs(acceleration)).toBeLessThanOrEqual(9.81 + 1e-12);
            }
        });
    }

    it('final data point reports the impact velocity without drag', () => {
        const params = { h0: 50, v0: 0, g: 9.81, m: 1, c: 0 };
        const points = runToImpact(params);
        const last = points[points.length - 1];

        expect(last.shouldStop).toBe(true);
        expect(last.position.y).toBe(0);
        expect(last.time).toBeCloseTo(Math.sqrt((2 * 50) / 9.81), 9);
        expect(last.velocity).toBeCloseTo(-Math.sqrt(2 * 9.81 * 50), 6);
        expect(last.energy_kinetic).toBeCloseTo(9.81 * 50, 6); // all potential energy converted
        // time stays monotonic: the impact point is between the last two loop steps
        expect(last.time).toBeGreaterThan(points[points.length - 2].time);
    });

    it('final data point reports the impact velocity with drag', () => {
        const params = { h0: 50, v0: 0, g: 9.81, m: 1, c: 1 };
        const points = runToImpact(params);
        const last = points[points.length - 1];
        const gamma = 1;
        const vTerminal = -9.81 / gamma;
        const expected = vTerminal + (0 - vTerminal) * Math.exp(-gamma * last.time);

        expect(last.shouldStop).toBe(true);
        expect(last.velocity).toBeCloseTo(expected, 9);
        expect(last.velocity).toBeLessThan(-1); // moving at impact, not zeroed
        expect(Math.abs(last.velocity)).toBeLessThan(Math.abs(vTerminal)); // below terminal speed
    });

    it('stays on the vacuum drop plus the first drag correction when c is tiny', () => {
        // The expanded v_t form cancels at c = 1e-8 and is off by about a millimetre.
        const t = 3;
        const g = 9.81;
        const c = 1e-8;
        const point = calculateFreeFallStep(t, { h0: 80, v0: 0, g, m: 1, c });
        const yVacuum = 80 - 0.5 * g * t * t;
        const ySeries = yVacuum - c * (0 - (g * t * t * t) / 6);
        expect(Math.abs(point.position.y - ySeries)).toBeLessThan(1e-9);
        expect(Math.abs(point.position.y - yVacuum)).toBeLessThan(1e-6);
    });

    it('treats h0 = 0 as ground level, not as the default height', () => {
        // Thrown up from the ground at 5 m/s: lands after 2·v0/g at -v0
        const points = runToImpact({ h0: 0, v0: 5, g: 9.81, m: 1, c: 0 });
        const last = points[points.length - 1];

        expect(points[0].position.y).toBe(0);
        expect(last.time).toBeCloseTo((2 * 5) / 9.81, 9);
        expect(last.velocity).toBeCloseTo(-5, 6);
    });
});
