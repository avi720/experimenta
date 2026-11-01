import { describe, expect, it } from 'vitest';
import { calculateFreeFallStep } from './engines/freeFallEngine';
import { calculateStep as shoStep } from './engines/shoEngine';
import {
    calculateInterference,
    electronWavelength,
    type DoubleSlitPoint,
} from './engines/doubleSlitEngine';
import { calculateQuantumTunnelingStep } from './engines/quantumTunnelingEngine';
import { EXPERIMENT_REGISTRY } from './experimentRegistry';
import { EXPERIMENT_GUIDES } from './guides';
import {
    solveAcceleratingVoltage,
    solveBarrierHeight,
    solveBarrierWidth,
    solveFreeFallDragFromAcceleration,
    solveFreeFallDragFromTerminalVelocity,
    solveFreeFallGravityFromHeight,
    solveFreeFallGravityFromSpeedSquared,
    solveFreeFallGravityFromVelocity,
    solveShoDampingFromEnvelope,
    solveShoDampingFromForce,
    solveShoMassFromForce,
    solveShoMassFromPeriod,
    solveShoSpringFromForce,
    solveShoSpringFromPeriod,
    solveSlitSpacingFromFringe,
    solveSlitSpacingFromSpacing,
    solveSlitSpacingOrders,
    solveSlitWidthFromEnvelope,
    solveWavelengthFromFringe,
    solveWavelengthFromSpacing,
    solveWavelengthOrders,
    type UnknownSolution,
} from './solveUnknown';

/**
 * Textbook fixtures for find-the-unknown. The expected root is computed here from the
 * closed form. It is not computed by calling the solver. The same tolerance as the export
 * fixtures: 5×10⁻⁷ + 4ε·max(1, |x|). A non-zero root smaller than 5×10⁻⁷ is checked
 * relatively, so a solver that returns 0 does not pass.
 */
const ABSOLUTE = 5e-7;

function toleranceOf(expected: number): number {
    return ABSOLUTE + 4 * Number.EPSILON * Math.max(1, Math.abs(expected));
}

function matches(actual: number, expected: number): boolean {
    const error = Math.abs(actual - expected);
    if (expected !== 0 && Math.abs(expected) < ABSOLUTE) return error <= 1e-6 * Math.abs(expected);
    return error <= toleranceOf(expected);
}

function expectUnique(result: UnknownSolution, expected: number, unit: string) {
    expect(result.unit).toBe(unit);
    expect(result.status).toBe('unique');
    expect(result.values).toHaveLength(1);
    expect(result.values.every(Number.isFinite)).toBe(true);
    expect(matches(result.values[0], expected)).toBe(true);
}

function expectIncludes(result: UnknownSolution, expected: number, unit: string) {
    expect(result.unit).toBe(unit);
    expect(result.status === 'unique' || result.status === 'multiple').toBe(true);
    expect(result.values.length).toBeGreaterThan(0);
    expect(result.values.every(Number.isFinite)).toBe(true);
    expect(result.values.some((value) => matches(value, expected))).toBe(true);
}

function expectNone(result: UnknownSolution, unit: string, reason: string) {
    expect(result.status).toBe('none');
    expect(result.unit).toBe(unit);
    expect(result.values).toEqual([]);
    expect(result.reason).toBe(reason);
}

function expectError(result: UnknownSolution, unit: string) {
    expect(result.status).toBe('error');
    expect(result.unit).toBe(unit);
    expect(result.values).toEqual([]);
    expect(result.values).not.toContain(Number.NaN);
    expect(result.reason).toBeTruthy();
}

function symbolUnit(slug: string, tex: string): string {
    const unit = EXPERIMENT_GUIDES[slug]?.symbols.find((entry) => entry.tex === tex)?.unit;
    if (unit === undefined) throw new Error(`${slug} ${tex}`);
    return unit;
}

// --- Independent textbook forwards (not the solvers, not the engines) ---

const HBAR = 1.054571817e-34;
const LIGHT = 299792458;
const EV = 1.602176634e-19;
const PLANCK = 6.62607015e-34;
const ELECTRON_MASS = 9.1093837015e-31;

type Fall = { h0: number; v0: number; g: number; m: number; c: number };

/** Taylor §2.2–2.4. y upward. Tiny drag uses the first order in γ = c/m, where v_t − v_t cancels. */
function textbookFall(t: number, { h0, v0, g, m, c }: Fall) {
    if (!(c > 0)) {
        const velocity = v0 - g * t;
        return { y: h0 + v0 * t - 0.5 * g * t * t, velocity, acceleration: -g };
    }
    const gamma = c / m;
    if (gamma * t < 1e-3) {
        const velocity = v0 - g * t - gamma * (v0 * t - (g * t * t) / 2);
        const y = h0 + v0 * t - 0.5 * g * t * t - gamma * ((v0 * t * t) / 2 - (g * t * t * t) / 6);
        return { y, velocity, acceleration: -g - gamma * velocity };
    }
    const terminal = -g / gamma;
    const decay = Math.exp(-gamma * t);
    const velocity = terminal + (v0 - terminal) * decay;
    const y = h0 + terminal * t + ((v0 - terminal) / gamma) * (1 - decay);
    return { y, velocity, acceleration: -g - gamma * velocity };
}

type Sho = { m: number; k: number; c: number; x0: number; v0: number };

/** Taylor §5.2. γ = c/(2m), ω₀ = √(k/m). Acceleration is Newton's law applied to x and v. */
function textbookSho(t: number, { m, k, c, x0, v0 }: Sho) {
    const omega0 = Math.sqrt(k / m);
    const gamma = c / (2 * m);
    let x: number;
    let velocity: number;
    if (!(c > 0)) {
        const amplitude = Math.hypot(x0, v0 / omega0);
        const phi = Math.atan2(-v0 / omega0, x0);
        x = amplitude * Math.cos(omega0 * t + phi);
        velocity = -amplitude * omega0 * Math.sin(omega0 * t + phi);
    } else if (Math.abs(omega0 * omega0 - gamma * gamma) < 1e-12) {
        const slope = v0 + gamma * x0;
        const decay = Math.exp(-gamma * t);
        x = (x0 + slope * t) * decay;
        velocity = (slope - gamma * (x0 + slope * t)) * decay;
    } else if (omega0 > gamma) {
        const omegaD = Math.sqrt(omega0 * omega0 - gamma * gamma);
        const decay = Math.exp(-gamma * t);
        const sine = (v0 + gamma * x0) / omegaD;
        x = decay * (x0 * Math.cos(omegaD * t) + sine * Math.sin(omegaD * t));
        velocity = -gamma * x + decay * (-x0 * omegaD * Math.sin(omegaD * t) + sine * omegaD * Math.cos(omegaD * t));
    } else {
        const root = Math.sqrt(gamma * gamma - omega0 * omega0);
        const r1 = -gamma + root;
        const r2 = -gamma - root;
        const c1 = (v0 - r2 * x0) / (r1 - r2);
        const c2 = (r1 * x0 - v0) / (r1 - r2);
        x = c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t);
        velocity = c1 * r1 * Math.exp(r1 * t) + c2 * r2 * Math.exp(r2 * t);
    }
    return {
        x,
        velocity,
        acceleration: -(k / m) * x - (c / m) * velocity,
        period: (2 * Math.PI) / omega0,
    };
}

function tunnelingParticle(speedOverC: number, massUi: number) {
    const massKg = ((massUi * 1e5) * EV) / (LIGHT * LIGHT);
    const energyJ = 0.5 * massKg * (speedOverC * LIGHT) ** 2;
    return { massKg, energyJ, energyEv: energyJ / EV };
}

/** Griffiths rectangular barrier. sinh²(x) = exp(2x)/4 once x is large enough that exp(−2x) underflows. */
function textbookTransmission(speedOverC: number, massUi: number, barrierEv: number, widthUm: number): number {
    const { massKg, energyJ } = tunnelingParticle(speedOverC, massUi);
    const barrierJ = barrierEv * EV;
    const widthM = widthUm * 1e-6;
    if (barrierEv === 0 || widthUm === 0) return 1;
    if (!(energyJ > 0)) return 0;
    if (Math.abs(energyJ - barrierJ) <= 1e-12 * Math.max(energyJ, barrierJ)) {
        return 1 / (1 + (massKg * barrierJ * widthM * widthM) / (2 * HBAR * HBAR));
    }
    if (energyJ < barrierJ) {
        const kappaL = (Math.sqrt(2 * massKg * (barrierJ - energyJ)) / HBAR) * widthM;
        const sinhSquared = kappaL > 40 ? Math.exp(2 * kappaL) / 4 : Math.sinh(kappaL) ** 2;
        return 1 / (1 + (barrierJ * barrierJ * sinhSquared) / (4 * energyJ * (barrierJ - energyJ)));
    }
    const k2L = (Math.sqrt(2 * massKg * (energyJ - barrierJ)) / HBAR) * widthM;
    return 1 / (1 + (barrierJ * barrierJ * Math.sin(k2L) ** 2) / (4 * energyJ * (energyJ - barrierJ)));
}

/** Hecht: bright fringe d sinθ = n λ, y = D tanθ. Returns y in mm. */
function textbookFringeMm(order: number, wavelengthNm: number, slitSpacingUm: number, screenDistanceM: number): number {
    const sine = (order * wavelengthNm * 1e-9) / (slitSpacingUm * 1e-6);
    return Math.tan(Math.asin(sine)) * screenDistanceM * 1e3;
}

function textbookElectronWavelengthNm(kilovolts: number): number {
    const kinetic = EV * kilovolts * 1000;
    const rest = ELECTRON_MASS * LIGHT * LIGHT;
    const momentum = Math.sqrt(2 * ELECTRON_MASS * kinetic * (1 + kinetic / (2 * rest)));
    return (PLANCK / momentum) * 1e9;
}

const nearest = (pattern: DoubleSlitPoint[], mm: number) =>
    pattern.reduce((best, point) => (Math.abs(point.position - mm) < Math.abs(best.position - mm) ? point : best));

describe('find-the-unknown coverage', () => {
    it('names every experiment in the catalogue', () => {
        expect(Object.values(EXPERIMENT_REGISTRY).map((entry) => entry.slug).sort()).toEqual([
            'double-slit',
            'free-fall',
            'quantum-tunneling',
            'sho',
        ]);
    });

    it('solves every parameter the challenge can hide, and the barrier quantities the charts cannot', () => {
        expect(EXPERIMENT_GUIDES['free-fall']?.unknowns.map((item) => item.key)).toEqual(['g', 'c']);
        expect(EXPERIMENT_GUIDES.sho?.unknowns.map((item) => item.key)).toEqual(['k', 'm', 'c']);
        expect(EXPERIMENT_GUIDES['double-slit']?.unknowns.map((item) => item.key)).toEqual(['wavelength', 'slit_spacing']);
        // Inverting T for V₀ or L is a sinh/sin root, not a length a student reads off the chart.
        expect(EXPERIMENT_GUIDES['quantum-tunneling']?.unknowns).toEqual([]);
    });
});

describe('free fall unknowns', () => {
    const gravity = symbolUnit('free-fall', 'g');
    const drag = symbolUnit('free-fall', 'c');

    it('uses the units printed beside the controls and on the chart', () => {
        expect(gravity).toBe('m/s²');
        expect(drag).toBe('kg/s');
        expect(symbolUnit('free-fall', 'y')).toBe('m');
        expect(symbolUnit('free-fall', 'v')).toBe('m/s');
        expect(symbolUnit('free-fall', 't')).toBe('s');
    });

    const trajectories = [
        { name: 'dropped from rest', h0: 50, v0: 0, g: 9.81, t: 2 },
        { name: 'thrown upward', h0: 20, v0: 15, g: 9.81, t: 1.2 },
        { name: 'small g', h0: 8, v0: 0, g: 1e-4, t: 4 },
        { name: 'large g', h0: 400, v0: -5, g: 30, t: 1 },
        { name: 'zero g', h0: 10, v0: 2, g: 0, t: 3 },
        { name: 'short time', h0: 20, v0: 1, g: 9.81, t: 1e-4 },
        { name: 'tall drop', h0: 1e6, v0: 0, g: 1.62, t: 20 },
    ];

    it.each(trajectories)('g from the height matches the vacuum formula ($name)', ({ h0, v0, g, t }) => {
        const { y, velocity } = textbookFall(t, { h0, v0, g, m: 1, c: 0 });
        const fromHeight = solveFreeFallGravityFromHeight({
            initialHeightM: h0, initialVelocityMps: v0, heightM: y, timeS: t,
        });
        const fromVelocity = solveFreeFallGravityFromVelocity({
            initialVelocityMps: v0, velocityMps: velocity, timeS: t,
        });
        const fromSpeed = solveFreeFallGravityFromSpeedSquared({
            initialHeightM: h0, initialVelocityMps: v0, heightM: y, velocityMps: velocity,
        });
        expectUnique(fromHeight, g, gravity);
        expectUnique(fromVelocity, g, gravity);
        expectUnique(fromSpeed, g, gravity);

        const solved = fromHeight.values[0];
        const yBack = h0 + v0 * t - 0.5 * solved * t * t;
        expect(matches(yBack, y)).toBe(true);
        const engine = calculateFreeFallStep(t, { h0, v0, g: solved, m: 1, c: 0 });
        expect(matches(engine.position.y, y)).toBe(true);
        expect(matches(engine.velocity, velocity)).toBe(true);
    });

    it('recovers g from the engine impact, y = 0', () => {
        const g = 3.71;
        const h0 = 45;
        const landed = calculateFreeFallStep(40, { h0, v0: 0, g, m: 1, c: 0 });
        expect(landed.position.y).toBe(0);
        expect(landed.shouldStop).toBe(true);
        const solved = solveFreeFallGravityFromHeight({
            initialHeightM: h0, initialVelocityMps: 0, heightM: 0, timeS: landed.time,
        });
        expectUnique(solved, g, gravity);
        const again = calculateFreeFallStep(40, { h0, v0: 0, g: solved.values[0], m: 1, c: 0 });
        expect(matches(again.time, landed.time)).toBe(true);
        expect(again.position.y).toBe(0);
    });

    it('reports no unique g at the initial instant, or back at the same height with the same speed', () => {
        expectNone(
            solveFreeFallGravityFromHeight({ initialHeightM: 10, initialVelocityMps: 4, heightM: 10, timeS: 0 }),
            gravity,
            'indeterminate',
        );
        expectNone(
            solveFreeFallGravityFromHeight({ initialHeightM: 10, initialVelocityMps: 0, heightM: 12, timeS: 0 }),
            gravity,
            'inconsistent',
        );
        expectNone(
            solveFreeFallGravityFromVelocity({ initialVelocityMps: 4, velocityMps: 4, timeS: 0 }),
            gravity,
            'indeterminate',
        );
        expectNone(
            solveFreeFallGravityFromSpeedSquared({ initialHeightM: 10, initialVelocityMps: 6, heightM: 10, velocityMps: -6 }),
            gravity,
            'indeterminate',
        );
        expectError(solveFreeFallGravityFromHeight({ initialHeightM: 10, initialVelocityMps: 0, heightM: 9, timeS: -1 }), gravity);
        expectError(solveFreeFallGravityFromHeight({ initialHeightM: 10, initialVelocityMps: 0, heightM: Number.NaN, timeS: 1 }), gravity);
    });

    it('allows a negative g when the body rises while released from rest', () => {
        const solved = solveFreeFallGravityFromHeight({ initialHeightM: 10, initialVelocityMps: 0, heightM: 12, timeS: 2 });
        expectUnique(solved, -1, gravity);
        const engine = calculateFreeFallStep(2, { h0: 10, v0: 0, g: solved.values[0], m: 1, c: 0 });
        expect(matches(engine.position.y, 12)).toBe(true);
    });

    it.each([
        { name: 'moderate drag', h0: 200, v0: 4, g: 9.81, m: 2, c: 0.7, t: 1.5 },
        { name: 'thrown up with drag', h0: 30, v0: 12, g: 10, m: 1, c: 0.4, t: 0.4 },
        { name: 'tiny drag', h0: 80, v0: 0, g: 9.81, m: 1, c: 1e-8, t: 2 },
        { name: 'large drag', h0: 500, v0: 0, g: 9.81, m: 0.2, c: 5, t: 0.3 },
        { name: 'zero drag', h0: 40, v0: 3, g: 9.81, m: 1, c: 0, t: 1 },
    ])('c from acceleration matches Newton’s law ($name)', ({ h0, v0, g, m, c, t }) => {
        const motion = textbookFall(t, { h0, v0, g, m, c });
        const solved = solveFreeFallDragFromAcceleration({
            massKg: m, gravity: g, accelerationMps2: motion.acceleration, velocityMps: motion.velocity,
        });
        expectUnique(solved, c, drag);
        const engine = calculateFreeFallStep(t, { h0, v0, g, m, c: solved.values[0] });
        expect(matches(engine.velocity, motion.velocity)).toBe(true);
        expect(matches(engine.acceleration, motion.acceleration)).toBe(true);
        expect(matches(engine.position.y, motion.y)).toBe(true);
        const again = solveFreeFallDragFromAcceleration({
            massKg: m, gravity: g, accelerationMps2: engine.acceleration, velocityMps: engine.velocity,
        });
        expectUnique(again, c, drag);
    });

    it('reads the terminal velocity with its chart sign, positive upward', () => {
        const m = 2;
        const g = 9.81;
        const c = 0.5;
        const terminal = -(m * g) / c;
        expect(terminal).toBeLessThan(0);
        const solved = solveFreeFallDragFromTerminalVelocity({ massKg: m, gravity: g, terminalVelocityMps: terminal });
        expectUnique(solved, c, drag);
        expect(solved.values[0]).toBeCloseTo((m * g) / Math.abs(terminal), 12);
        const upward = solveFreeFallDragFromTerminalVelocity({ massKg: m, gravity: g, terminalVelocityMps: -terminal });
        expectUnique(upward, -c, drag);
        const back = -(m * g) / solved.values[0];
        expect(matches(back, terminal)).toBe(true);
    });

    it('does not invent a drag coefficient when the body is instantaneously at rest', () => {
        expectNone(
            solveFreeFallDragFromAcceleration({ massKg: 1, gravity: 9.81, accelerationMps2: -9.81, velocityMps: 0 }),
            drag,
            'indeterminate',
        );
        expectNone(
            solveFreeFallDragFromAcceleration({ massKg: 1, gravity: 9.81, accelerationMps2: -3, velocityMps: 0 }),
            drag,
            'inconsistent',
        );
        expectNone(
            solveFreeFallDragFromTerminalVelocity({ massKg: 1, gravity: 9.81, terminalVelocityMps: 0 }),
            drag,
            'no-finite-drag',
        );
        expectNone(
            solveFreeFallDragFromTerminalVelocity({ massKg: 1, gravity: 0, terminalVelocityMps: 0 }),
            drag,
            'indeterminate',
        );
        expectError(solveFreeFallDragFromAcceleration({ massKg: 0, gravity: 9.81, accelerationMps2: -9.81, velocityMps: -1 }), drag);
        expectError(solveFreeFallDragFromTerminalVelocity({ massKg: -1, gravity: 9.81, terminalVelocityMps: -5 }), drag);
    });
});

describe('harmonic oscillator unknowns', () => {
    const spring = symbolUnit('sho', 'k');
    const mass = symbolUnit('sho', 'm');
    const damping = symbolUnit('sho', 'c');

    it('uses the units printed beside the controls', () => {
        expect(spring).toBe('N/m');
        expect(mass).toBe('kg');
        expect(damping).toBe('kg/s');
        expect(symbolUnit('sho', 'T')).toBe('s');
        expect(symbolUnit('sho', 'x')).toBe('m');
    });

    const undamped = [
        { name: 'released from rest', m: 1.3, k: 23.5, x0: 1, v0: 0 },
        { name: 'pushed from equilibrium', m: 2, k: 8, x0: 0, v0: 3 },
        { name: 'heavy mass', m: 5, k: 10, x0: 0.2, v0: -0.4 },
        { name: 'stiff spring', m: 0.5, k: 180, x0: 0.05, v0: 0 },
        { name: 'long period', m: 1, k: (4 * Math.PI ** 2) / 1e6, x0: 1, v0: 0 },
    ];

    it.each(undamped)('k and m from the period ($name)', ({ m, k, x0, v0 }) => {
        const period = 2 * Math.PI * Math.sqrt(m / k);
        expectUnique(solveShoSpringFromPeriod({ massKg: m, periodS: period }), k, spring);
        expectUnique(solveShoMassFromPeriod({ springNm: k, periodS: period }), m, mass);
        const motion = textbookSho(period / 7, { m, k, c: 0, x0, v0 });
        expect(matches(motion.period, period)).toBe(true);
        const engine = shoStep(period / 7, { m, k, c: 0, x0, v0 });
        expect(matches(engine.position, motion.x)).toBe(true);
        expect(matches(engine.period, period)).toBe(true);
        const solvedK = solveShoSpringFromPeriod({ massKg: m, periodS: engine.period });
        expectUnique(solvedK, k, spring);
        const replay = shoStep(period / 7, { m, k: solvedK.values[0], c: 0, x0, v0 });
        expect(matches(replay.position, motion.x)).toBe(true);
    });

    it.each([
        { name: 'undamped', m: 1, k: 10, c: 0, x0: 0.8, v0: 0.3, t: 0.4 },
        { name: 'underdamped', m: 1.5, k: 12, c: 0.4, x0: 1, v0: 0, t: 0.35 },
        { name: 'critical', m: 1, k: 9, c: 6, x0: 2, v0: 1, t: 0.5 },
        { name: 'overdamped', m: 1, k: 10, c: 20, x0: 1, v0: 0, t: 0.2 },
        { name: 'tiny damping', m: 1, k: 4, c: 1e-8, x0: 1, v0: 0.2, t: 0.5 },
    ])('k, m and c from Newton’s law ($name)', ({ m, k, c, x0, v0, t }) => {
        const motion = textbookSho(t, { m, k, c, x0, v0 });
        expectUnique(solveShoSpringFromForce({
            massKg: m, positionM: motion.x, velocityMps: motion.velocity, accelerationMps2: motion.acceleration, dampingKgPerS: c,
        }), k, spring);
        expectUnique(solveShoMassFromForce({
            springNm: k, positionM: motion.x, velocityMps: motion.velocity, accelerationMps2: motion.acceleration, dampingKgPerS: c,
        }), m, mass);
        if (motion.velocity !== 0) {
            expectUnique(solveShoDampingFromForce({
                massKg: m, springNm: k, positionM: motion.x, velocityMps: motion.velocity, accelerationMps2: motion.acceleration,
            }), c, damping);
        }
        const engine = shoStep(t, { m, k, c, x0, v0 });
        expect(matches(engine.position, motion.x)).toBe(true);
        expect(matches(engine.velocity, motion.velocity)).toBe(true);
        expect(matches(engine.acceleration, motion.acceleration)).toBe(true);
        const solved = solveShoDampingFromForce({
            massKg: m, springNm: k, positionM: engine.position, velocityMps: engine.velocity, accelerationMps2: engine.acceleration,
        });
        if (engine.velocity === 0) {
            expectNone(solved, damping, 'indeterminate');
        } else {
            expectUnique(solved, c, damping);
            const replay = shoStep(t, { m, k, c: solved.values[0], x0, v0 });
            expect(matches(replay.velocity, engine.velocity)).toBe(true);
        }
    });

    it('recovers c from two envelope peaks, including troughs', () => {
        const params = { m: 1, k: 10, c: 0.4, x0: 1, v0: 0 };
        const gamma = params.c / (2 * params.m);
        const omegaD = Math.sqrt(params.k / params.m - gamma * gamma);
        const period = (2 * Math.PI) / omegaD;
        const later = params.x0 * Math.exp(-gamma * period);
        expectUnique(solveShoDampingFromEnvelope({
            massKg: params.m, firstPeakM: params.x0, laterPeakM: later, deltaTSeconds: period,
        }), params.c, damping);
        expectUnique(solveShoDampingFromEnvelope({
            massKg: params.m, firstPeakM: -params.x0, laterPeakM: -later, deltaTSeconds: period,
        }), params.c, damping);

        const engineLater = shoStep(period, params).position;
        expect(matches(engineLater, later)).toBe(true);
        const solved = solveShoDampingFromEnvelope({
            massKg: params.m, firstPeakM: params.x0, laterPeakM: engineLater, deltaTSeconds: period,
        });
        expectUnique(solved, params.c, damping);
        const gammaBack = solved.values[0] / (2 * params.m);
        expect(matches(params.x0 * Math.exp(-gammaBack * period), later)).toBe(true);
    });

    it('returns no spring, mass or damping when the sample does not determine them', () => {
        expectError(solveShoSpringFromPeriod({ massKg: 1, periodS: 0 }), spring);
        expectError(solveShoSpringFromPeriod({ massKg: 0, periodS: 1 }), spring);
        expectError(solveShoMassFromPeriod({ springNm: -4, periodS: 1 }), mass);
        expectError(solveShoDampingFromEnvelope({ massKg: 1, firstPeakM: 1, laterPeakM: 0, deltaTSeconds: 1 }), damping);
        expectError(solveShoDampingFromEnvelope({ massKg: 1, firstPeakM: 1, laterPeakM: 0.5, deltaTSeconds: 0 }), damping);
        expectNone(solveShoSpringFromForce({
            massKg: 1, positionM: 0, velocityMps: 0, accelerationMps2: 0, dampingKgPerS: 0,
        }), spring, 'indeterminate');
        expectNone(solveShoDampingFromForce({
            massKg: 1, springNm: 10, positionM: 1, velocityMps: 0, accelerationMps2: -10,
        }), damping, 'indeterminate');
        expectNone(solveShoDampingFromForce({
            massKg: 1, springNm: 10, positionM: 1, velocityMps: 0, accelerationMps2: 0,
        }), damping, 'inconsistent');
        expectNone(solveShoMassFromForce({
            springNm: 10, positionM: 0, velocityMps: 0, accelerationMps2: 0,
        }), mass, 'indeterminate');
        const zeroSpring = solveShoSpringFromForce({
            massKg: 1, positionM: 1, velocityMps: 2, accelerationMps2: 0,
        });
        expectUnique(zeroSpring, 0, spring);
        const coasting = shoStep(0.5, { m: 1, k: zeroSpring.values[0], c: 0, x0: 1, v0: 2 });
        expect(matches(coasting.position, 2)).toBe(true);
    });
});

describe('double slit unknowns', () => {
    const wavelength = symbolUnit('double-slit', '\\lambda');
    const spacing = symbolUnit('double-slit', 'd');
    const width = symbolUnit('double-slit', 'a');
    const voltage = symbolUnit('double-slit', 'U');

    it('uses the chart millimetre and the control units from the hint', () => {
        expect(symbolUnit('double-slit', 'y')).toBe('mm');
        expect(symbolUnit('double-slit', '\\Delta y')).toBe('mm');
        expect(wavelength).toBe('nm');
        expect(spacing).toBe('µm');
        expect(width).toBe('µm');
        expect(symbolUnit('double-slit', 'D')).toBe('m');
        expect(voltage).toBe('kV');
    });

    it('λ and d from a bright fringe, exact sinθ, round-trip through the pattern', () => {
        const lambdaNm = 500;
        const slitUm = 200;
        const distanceM = 1;
        const yMm = textbookFringeMm(1, lambdaNm, slitUm, distanceM);
        const solvedLambda = solveWavelengthFromFringe({
            positionMm: yMm, order: 1, slitSpacingUm: slitUm, screenDistanceM: distanceM,
        });
        const solvedSpacing = solveSlitSpacingFromFringe({
            positionMm: yMm, order: 1, wavelengthNm: lambdaNm, screenDistanceM: distanceM,
        });
        expectUnique(solvedLambda, lambdaNm, wavelength);
        expectUnique(solvedSpacing, slitUm, spacing);
        expect(matches(textbookFringeMm(1, solvedLambda.values[0], slitUm, distanceM), yMm)).toBe(true);
        expect(matches(textbookFringeMm(-1, lambdaNm, solvedSpacing.values[0], distanceM), -yMm)).toBe(true);

        const opposite = solveWavelengthFromFringe({
            positionMm: -yMm, order: -1, slitSpacingUm: slitUm, screenDistanceM: distanceM,
        });
        expectUnique(opposite, lambdaNm, wavelength);

        const pattern = calculateInterference({
            source: 'light', wavelength: solvedLambda.values[0], slit_spacing: slitUm, slit_width: 20, screen_distance: distanceM,
        });
        expect(nearest(pattern, yMm).intensity).toBeGreaterThan(0.9);
        expect(nearest(pattern, yMm / 2).intensity).toBeLessThan(0.05);
    });

    it('λ = Δy·d/D in millimetres, micrometres and metres', () => {
        const fringeMm = 2.5;
        const slitUm = 200;
        const distanceM = 2;
        // Independent of the cancelled form: convert each factor, then convert λ back to nm.
        const lambdaNm = ((fringeMm * 1e-3) * (slitUm * 1e-6) / distanceM) * 1e9;
        expect(lambdaNm).toBe(250);
        expectUnique(solveWavelengthFromSpacing({
            fringeSpacingMm: fringeMm, slitSpacingUm: slitUm, screenDistanceM: distanceM,
        }), lambdaNm, wavelength);
        const spacingM = (lambdaNm * 1e-9 * distanceM) / (fringeMm * 1e-3);
        expectUnique(solveSlitSpacingFromSpacing({
            fringeSpacingMm: fringeMm, wavelengthNm: lambdaNm, screenDistanceM: distanceM,
        }), spacingM * 1e6, spacing);
        const fringeBack = (solvedSpacingMm(lambdaNm, slitUm, distanceM));
        expect(matches(fringeBack, fringeMm)).toBe(true);
    });

    it('reports every fringe order that lands on one measured spot', () => {
        const yMm = textbookFringeMm(1, 600, 400, 1);
        const wavelengths = solveWavelengthOrders({
            positionMm: yMm, slitSpacingUm: 400, screenDistanceM: 1, maxOrder: 4,
        });
        expect(wavelengths.status).toBe('multiple');
        expect(wavelengths.values).toHaveLength(4);
        for (const order of [1, 2, 3, 4]) {
            expectIncludes(wavelengths, 600 / order, wavelength);
        }
        const spacings = solveSlitSpacingOrders({
            positionMm: yMm, wavelengthNm: 600, screenDistanceM: 1, maxOrder: 3,
        });
        expect(spacings.status).toBe('multiple');
        for (const order of [1, 2, 3]) expectIncludes(spacings, order * 400, spacing);
    });

    it('the central fringe and a non-positive spacing do not yield a wavelength', () => {
        expectNone(solveWavelengthFromFringe({
            positionMm: 0, order: 1, slitSpacingUm: 250, screenDistanceM: 1,
        }), wavelength, 'indeterminate');
        expectNone(solveWavelengthOrders({
            positionMm: 0, slitSpacingUm: 250, screenDistanceM: 1,
        }), wavelength, 'indeterminate');
        expectNone(solveWavelengthFromSpacing({
            fringeSpacingMm: 0, slitSpacingUm: 250, screenDistanceM: 1,
        }), wavelength, 'no-root');
        expectNone(solveSlitSpacingFromFringe({
            positionMm: 0, order: 1, wavelengthNm: 532, screenDistanceM: 1,
        }), spacing, 'indeterminate');
        expectError(solveWavelengthFromFringe({
            positionMm: 2, order: 1.5, slitSpacingUm: 250, screenDistanceM: 1,
        }), wavelength);
        expectError(solveWavelengthFromFringe({
            positionMm: 2, order: 0, slitSpacingUm: 250, screenDistanceM: 1,
        }), wavelength);
        expectError(solveSlitSpacingFromSpacing({
            fringeSpacingMm: 2, wavelengthNm: 0, screenDistanceM: 1,
        }), spacing);
        expectNone(solveWavelengthFromFringe({
            positionMm: -2, order: 1, slitSpacingUm: 250, screenDistanceM: 1,
        }), wavelength, 'out-of-domain');
    });

    it('slit width from the envelope zero, and voltage from the de Broglie wavelength', () => {
        const lambdaNm = 532;
        const widthUm = 50;
        const sine = (lambdaNm * 1e-9) / (widthUm * 1e-6);
        const yMm = Math.tan(Math.asin(sine)) * 1000;
        const solvedWidth = solveSlitWidthFromEnvelope({ positionMm: yMm, wavelengthNm: lambdaNm, screenDistanceM: 1 });
        expectUnique(solvedWidth, widthUm, width);
        expectNone(solveSlitWidthFromEnvelope({ positionMm: 0, wavelengthNm: lambdaNm, screenDistanceM: 1 }), width, 'indeterminate');

        for (const kilovolts of [0.05, 50, 200]) {
            const lambda = textbookElectronWavelengthNm(kilovolts);
            expectUnique(solveAcceleratingVoltage({ wavelengthNm: lambda }), kilovolts, voltage);
            const fromEngine = electronWavelength(kilovolts * 1000) * 1e9;
            const solved = solveAcceleratingVoltage({ wavelengthNm: fromEngine });
            expectUnique(solved, kilovolts, voltage);
            expect(matches(textbookElectronWavelengthNm(solved.values[0]), fromEngine)).toBe(true);
        }
        expectError(solveAcceleratingVoltage({ wavelengthNm: 0 }), voltage);
        expectError(solveAcceleratingVoltage({ wavelengthNm: -10 }), voltage);
    });
});

function solvedSpacingMm(lambdaNm: number, slitUm: number, distanceM: number): number {
    return ((lambdaNm * 1e-9) * distanceM / (slitUm * 1e-6)) * 1e3;
}

describe('quantum tunneling unknowns', () => {
    const height = symbolUnit('quantum-tunneling', 'V_0');
    const width = symbolUnit('quantum-tunneling', 'L');

    it('uses eV and µm, the units on the controls', () => {
        expect(height).toBe('eV');
        expect(width).toBe('µm');
        expect(symbolUnit('quantum-tunneling', 'v')).toBe('c');
        expect(symbolUnit('quantum-tunneling', 'm')).toBe('10⁵ eV/c²');
    });

    function recover(speed: number, mass: number, barrierEv: number, widthUm: number, maxUm = 0.05) {
        const transmission = textbookTransmission(speed, mass, barrierEv, widthUm);
        const widths = solveBarrierWidth({
            transmission, speedOverC: speed, massUi: mass, barrierEv, maxUm,
        });
        const heights = solveBarrierHeight({
            transmission, speedOverC: speed, massUi: mass, widthUm,
        });
        return { transmission, widths, heights };
    }

    it('L and V₀ below the barrier are the unique sinh inverse', () => {
        const speed = 0.002;
        const mass = 5.11;
        const barrierEv = 2;
        const widthUm = 0.001;
        expect(tunnelingParticle(speed, mass).energyEv).toBeLessThan(barrierEv);
        const { transmission, widths, heights } = recover(speed, mass, barrierEv, widthUm);
        expect(transmission).toBeGreaterThan(0);
        expect(transmission).toBeLessThan(1);
        expectUnique(widths, widthUm, width);
        expectIncludes(heights, barrierEv, height);
        for (const candidate of heights.values) {
            expect(matches(textbookTransmission(speed, mass, candidate, widthUm), transmission)).toBe(true);
        }
        const engine = calculateQuantumTunnelingStep(0, { v: speed, m: mass, V0: barrierEv, L: widthUm });
        expect(matches(engine.transmission, transmission)).toBe(true);
        const fromEngine = solveBarrierWidth({
            transmission: engine.transmission, speedOverC: speed, massUi: mass, barrierEv,
        });
        expectUnique(fromEngine, widthUm, width);
        const replay = calculateQuantumTunnelingStep(0, { v: speed, m: mass, V0: barrierEv, L: fromEngine.values[0] });
        expect(matches(replay.transmission, engine.transmission)).toBe(true);
    });

    it('a thick barrier and a very thin one still return that width', () => {
        const speed = 0.002;
        const mass = 5.11;
        const barrierEv = 1.2;
        for (const widthUm of [1e-8, 0.0001, 0.02]) {
            const transmission = textbookTransmission(speed, mass, barrierEv, widthUm);
            expect(transmission).toBeGreaterThan(0);
            const solved = solveBarrierWidth({
                transmission, speedOverC: speed, massUi: mass, barrierEv, maxUm: 1,
            });
            expectUnique(solved, widthUm, width);
        }
    });

    it('E = V₀ uses the limit formula, and the engine agrees', () => {
        const speed = 0.002;
        const mass = 5.11;
        const barrierEv = tunnelingParticle(speed, mass).energyEv;
        const widthUm = 0.002;
        const transmission = textbookTransmission(speed, mass, barrierEv, widthUm);
        const solved = solveBarrierWidth({
            transmission, speedOverC: speed, massUi: mass, barrierEv,
        });
        expectUnique(solved, widthUm, width);
        const engine = calculateQuantumTunnelingStep(0, { v: speed, m: mass, V0: barrierEv, L: widthUm });
        expect(matches(engine.transmission, transmission)).toBe(true);
        expectUnique(solveBarrierWidth({
            transmission: engine.transmission, speedOverC: speed, massUi: mass, barrierEv,
        }), widthUm, width);
    });

    it('E > V₀ reports every width with the same sin², not one of them', () => {
        const speed = 0.01;
        const mass = 5.11;
        const barrierEv = 1;
        const widthUm = 0.002;
        expect(tunnelingParticle(speed, mass).energyEv).toBeGreaterThan(barrierEv);
        const { transmission, widths } = recover(speed, mass, barrierEv, widthUm, 0.01);
        expect(widths.status).toBe('multiple');
        expectIncludes(widths, widthUm, width);
        expect(widths.values.length).toBeGreaterThan(2);
        for (const candidate of widths.values) {
            expect(matches(textbookTransmission(speed, mass, barrierEv, candidate), transmission)).toBe(true);
        }
        const engine = calculateQuantumTunnelingStep(0, { v: speed, m: mass, V0: barrierEv, L: widthUm });
        expect(matches(engine.transmission, transmission)).toBe(true);
        const fromEngine = solveBarrierWidth({
            transmission: engine.transmission, speedOverC: speed, massUi: mass, barrierEv, maxUm: 0.01,
        });
        expectIncludes(fromEngine, widthUm, width);
    });

    it('perfect transmission lists the resonances inside the control range and not past it', () => {
        const speed = 0.01;
        const mass = 5.11;
        const barrierEv = 1;
        const { massKg, energyJ } = tunnelingParticle(speed, mass);
        const k2 = Math.sqrt(2 * massKg * (energyJ - barrierEv * EV)) / HBAR;
        const spacingUm = (Math.PI / k2) * 1e6;
        const lastInside = Math.floor(0.05 / spacingUm + 1e-9);
        const insideUm = lastInside * spacingUm;
        const outsideUm = (lastInside + 1) * spacingUm;
        expect(lastInside).toBeGreaterThan(1);
        expect(insideUm).toBeLessThanOrEqual(0.05);
        expect(outsideUm).toBeGreaterThan(0.05);
        const inside = solveBarrierWidth({
            transmission: 1, speedOverC: speed, massUi: mass, barrierEv,
        });
        expect(inside.status).toBe('multiple');
        expect(inside.values.every((value) => value <= 0.05 * (1 + 1e-9))).toBe(true);
        expectIncludes(inside, 0, width);
        expectIncludes(inside, insideUm, width);
        expect(inside.values.some((value) => matches(value, outsideUm))).toBe(false);
        const widened = solveBarrierWidth({
            transmission: 1, speedOverC: speed, massUi: mass, barrierEv, maxUm: outsideUm + spacingUm,
        });
        expectIncludes(widened, outsideUm, width);
    });

    it('a transmission below the over-barrier minimum is no solution, and T = 0 is not a finite barrier', () => {
        const speed = 0.01;
        const mass = 5.11;
        const barrierEv = 1;
        const energyEv = tunnelingParticle(speed, mass).energyEv;
        const minimum = 1 / (1 + (barrierEv * barrierEv) / (4 * energyEv * (energyEv - barrierEv)));
        expectNone(solveBarrierWidth({
            transmission: minimum / 2, speedOverC: speed, massUi: mass, barrierEv, maxUm: 1,
        }), width, 'no-root');
        // Above the barrier T never reaches 0, so there is no root. Below it, only an infinite width would.
        expectNone(solveBarrierWidth({
            transmission: 0, speedOverC: speed, massUi: mass, barrierEv,
        }), width, 'no-root');
        expectNone(solveBarrierWidth({
            transmission: 0, speedOverC: 0.002, massUi: mass, barrierEv: 2,
        }), width, 'no-finite-barrier');
        expectNone(solveBarrierHeight({
            transmission: 0, speedOverC: speed, massUi: mass, widthUm: 0.001,
        }), height, 'no-finite-barrier');
    });

    it('no barrier, a particle at rest, and a bad probability are not a made-up root', () => {
        expectNone(solveBarrierWidth({
            transmission: 1, speedOverC: 0.01, massUi: 5.11, barrierEv: 0,
        }), width, 'indeterminate');
        expectNone(solveBarrierHeight({
            transmission: 1, speedOverC: 0.01, massUi: 5.11, widthUm: 0,
        }), height, 'indeterminate');
        expectNone(solveBarrierWidth({
            transmission: 0, speedOverC: 0, massUi: 5.11, barrierEv: 1,
        }), width, 'indeterminate');
        expectNone(solveBarrierWidth({
            transmission: 0.2, speedOverC: 0, massUi: 5.11, barrierEv: 1,
        }), width, 'inconsistent');
        expectError(solveBarrierWidth({
            transmission: 1.2, speedOverC: 0.01, massUi: 5.11, barrierEv: 1,
        }), width);
        expectError(solveBarrierWidth({
            transmission: -0.1, speedOverC: 0.01, massUi: 5.11, barrierEv: 1,
        }), width);
        expectError(solveBarrierHeight({
            transmission: Number.NaN, speedOverC: 0.01, massUi: 5.11, widthUm: 0.001,
        }), height);
        expectError(solveBarrierWidth({
            transmission: 0.5, speedOverC: 0.01, massUi: 0, barrierEv: 1,
        }), width);
        expectError(solveBarrierWidth({
            transmission: 0.5, speedOverC: -0.01, massUi: 5.11, barrierEv: 1,
        }), width);
        expectError(solveBarrierWidth({
            transmission: 0.5, speedOverC: 1.5, massUi: 5.11, barrierEv: 1,
        }), width);
        expectError(solveBarrierHeight({
            transmission: 0.5, speedOverC: 0.01, massUi: 5.11, widthUm: -0.001,
        }), height);
    });

    it('finds a tall barrier as well as the control maximum', () => {
        const speed = 0.002;
        const mass = 5.11;
        const widthUm = 0.0004;
        for (const barrierEv of [0.01, 10, 40]) {
            expect(tunnelingParticle(speed, mass).energyEv).toBeLessThan(40);
            const transmission = textbookTransmission(speed, mass, barrierEv, widthUm);
            expect(Number.isFinite(transmission)).toBe(true);
            expect(transmission).toBeGreaterThan(0);
            const solved = solveBarrierHeight({
                transmission, speedOverC: speed, massUi: mass, widthUm,
            });
            expectIncludes(solved, barrierEv, height);
            const engine = calculateQuantumTunnelingStep(0, { v: speed, m: mass, V0: barrierEv, L: widthUm });
            expect(matches(engine.transmission, transmission)).toBe(true);
        }
    });
});
