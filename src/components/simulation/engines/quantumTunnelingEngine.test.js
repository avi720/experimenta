import { describe, expect, it } from 'vitest';
import {
    DETECTOR_X_POSITION,
    calculateQuantumTunnelingStep,
    calculateTransmissionReflection,
} from './quantumTunnelingEngine.jsx';

// Constants defined independently of the engine (CODATA 2018).
const HBAR = 1.054571817e-34; // J·s
const ELECTRON_MASS = 9.1093837e-31; // kg
const EV = 1.602176634e-19; // J

// --- Minimal complex arithmetic for the reference solver ---
const c = (re, im = 0) => ({ re, im });
const add = (a, b) => c(a.re + b.re, a.im + b.im);
const sub = (a, b) => c(a.re - b.re, a.im - b.im);
const mul = (a, b) => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const div = (a, b) => {
    const d = b.re * b.re + b.im * b.im;
    return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
const scale = (a, s) => c(a.re * s, a.im * s);
// e^{i·k·x} for complex k and real x
const expIkx = (k, x) => {
    const mag = Math.exp(-k.im * x);
    return c(mag * Math.cos(k.re * x), mag * Math.sin(k.re * x));
};
// Wavenumber sqrt(2m(E - V))/ħ; imaginary (evanescent) when E < V
const wavenumber = (m, E, V) => {
    const k2 = (2 * m * (E - V)) / (HBAR * HBAR);
    return k2 >= 0 ? c(Math.sqrt(k2)) : c(0, Math.sqrt(-k2));
};

/**
 * Reference transmission through a rectangular barrier [0, L] of height V0,
 * computed by matching ψ and ψ' at both interfaces (transfer-matrix method).
 * Independent of the closed-form formulas used by the engine.
 */
function referenceTransmission(E, V0, L, m) {
    const k1 = wavenumber(m, E, 0);
    const k2 = wavenumber(m, E, V0);

    // Given (A_r, B_r) in the right region, return (A_l, B_l) in the left region at interface x = a.
    const matchLeft = (kl, kr, a, Ar, Br) => {
        const ratio = div(kr, kl);
        const plus = add(c(1), ratio);
        const minus = sub(c(1), ratio);
        const right = mul(Ar, expIkx(kr, a));
        const left = mul(Br, expIkx(scale(kr, -1), a));
        const Al = div(scale(add(mul(plus, right), mul(minus, left)), 0.5), expIkx(kl, a));
        const Bl = div(scale(add(mul(minus, right), mul(plus, left)), 0.5), expIkx(scale(kl, -1), a));
        return [Al, Bl];
    };

    // Transmitted wave only on the right: A3 = 1, B3 = 0
    const [A2, B2] = matchLeft(k2, k1, L, c(1), c(0));
    const [A1] = matchLeft(k1, k2, 0, A2, B2);
    return 1 / (A1.re * A1.re + A1.im * A1.im);
}

describe('quantum tunneling transmission (T6)', () => {
    const V0 = 1 * EV;
    const ratios = [0.5, 0.9, 1.022, 1.15, 2.0];

    for (const L of [1e-9, 5e-9]) {
        for (const ratio of ratios) {
            it(`matches the transfer-matrix solution at E/V0 = ${ratio}, L = ${L * 1e9} nm`, () => {
                const E = ratio * V0;
                const { transmission, reflection } = calculateTransmissionReflection(E, V0, L, ELECTRON_MASS);
                expect(Math.abs(transmission - referenceTransmission(E, V0, L, ELECTRON_MASS))).toBeLessThan(1e-6);
                expect(transmission + reflection).toBeCloseTo(1, 12);
            });
        }

        it(`uses the correct E = V0 limit, L = ${L * 1e9} nm`, () => {
            const expected = 1 / (1 + (ELECTRON_MASS * V0 * L * L) / (2 * HBAR * HBAR));
            const { transmission } = calculateTransmissionReflection(V0, V0, L, ELECTRON_MASS);
            expect(Math.abs(transmission - expected)).toBeLessThan(1e-6);
            // Continuity: the E = V0 value is the limit of the E < V0 and E > V0 branches
            for (const eps of [-1e-7, 1e-7]) {
                const nearby = referenceTransmission(V0 * (1 + eps), V0, L, ELECTRON_MASS);
                expect(Math.abs(transmission - nearby)).toBeLessThan(1e-6);
            }
        });
    }

    it('reaches full transmission at a resonance (k2·L = π)', () => {
        const L = 1e-9;
        const k2 = Math.PI / L;
        const E = V0 + (HBAR * HBAR * k2 * k2) / (2 * ELECTRON_MASS);
        const { transmission } = calculateTransmissionReflection(E, V0, L, ELECTRON_MASS);
        expect(transmission).toBeCloseTo(1, 9);
    });

    it('returns transmission = 0 for non-physical inputs', () => {
        expect(calculateTransmissionReflection(0, V0, 1e-9, ELECTRON_MASS).transmission).toBe(0);
        expect(calculateTransmissionReflection(V0, V0, 0, ELECTRON_MASS).transmission).toBe(0);
    });
});

describe('calculateQuantumTunnelingStep', () => {
    it('reports transmission consistent with the UI-unit parameters', () => {
        // v = 0.002c electron, V0 = 1 eV, L = 0.001 µm
        const params = { v: 0.002, m: 5.11, V0: 1, L: 0.001 };
        const point = calculateQuantumTunnelingStep(0, params);

        const mass = 5.11e5 * (EV / (299792458 * 299792458));
        const speed = 0.002 * 299792458;
        const E = 0.5 * mass * speed * speed;
        const expected = referenceTransmission(E, 1 * EV, 0.001e-6, mass);

        expect(Math.abs(point.transmission - expected)).toBeLessThan(1e-6);
        expect(point.transmission + point.reflection).toBeCloseTo(1, 12);
        expect(point.debug.ratio_E_V0).toBeCloseTo(E / EV, 9);
    });

    it('collapses the wave-function at DETECTOR_X_POSITION = 25 based on _collapseRandom (T49)', () => {
        expect(DETECTOR_X_POSITION).toBe(25);
        // Choose parameters where 0 < transmission < 1 (v = 0.002c, V0 = 1 eV, L = 0.001 µm)
        const baseParams = { v: 0.002, m: 5.11, V0: 1, L: 0.001 };
        const initial = calculateQuantumTunnelingStep(0, { ...baseParams, _collapseRandom: 0.0 });
        expect(initial.position).toBeLessThan(DETECTOR_X_POSITION);
        expect(initial.hasCollapsed).toBe(false);
        expect(initial.measurementResult).toBeNull();
        expect(initial.transmission).toBeGreaterThan(0);
        expect(initial.transmission).toBeLessThan(1);

        // At t = 25 s, position reaches the cap (50 >= 25)
        const collapsedTransmitted = calculateQuantumTunnelingStep(25, {
            ...baseParams,
            _collapseRandom: initial.transmission * 0.5,
        });
        expect(collapsedTransmitted.position).toBeGreaterThanOrEqual(DETECTOR_X_POSITION);
        expect(collapsedTransmitted.hasCollapsed).toBe(true);
        expect(collapsedTransmitted.measurementResult).toBe('transmitted');

        const collapsedReflected = calculateQuantumTunnelingStep(25, {
            ...baseParams,
            _collapseRandom: initial.transmission + (1 - initial.transmission) * 0.5,
        });
        expect(collapsedReflected.position).toBeGreaterThanOrEqual(DETECTOR_X_POSITION);
        expect(collapsedReflected.hasCollapsed).toBe(true);
        expect(collapsedReflected.measurementResult).toBe('reflected');
    });

    it('does not collapse if neither randomSeed nor _collapseRandom is provided (legacy runs) (T49)', () => {
        const baseParams = { v: 0.002, m: 5.11, V0: 1, L: 0.001 };
        const legacy = calculateQuantumTunnelingStep(25, baseParams);
        expect(legacy.position).toBeGreaterThanOrEqual(DETECTOR_X_POSITION);
        expect(legacy.hasCollapsed).toBe(false);
        expect(legacy.measurementResult).toBeNull();
    });

    it('supports generic randomSeed for collapse determination', () => {
        const baseParams = { v: 0.002, m: 5.11, V0: 1, L: 0.001 };
        const point = calculateQuantumTunnelingStep(0, baseParams);
        const result = calculateQuantumTunnelingStep(25, {
            ...baseParams,
            randomSeed: point.transmission * 0.25,
        });
        expect(result.hasCollapsed).toBe(true);
        expect(result.measurementResult).toBe('transmitted');
    });
});
