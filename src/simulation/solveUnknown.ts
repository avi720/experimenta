/**
 * Closed-form inverses for "find the unknown".
 *
 * Each function isolates one parameter from a textbook equation and returns it in the unit
 * the control shows (m/s², kg/s, N/m, nm, µm, eV, …). The lab still asks the student to do
 * this; these functions are the checked version of that arithmetic.
 *
 * No root is ever NaN or Infinity. A measurement that does not determine the parameter
 * (a rest instant, the central fringe, a transmission of 0) is `none`. Garbage or a
 * negative mass, period, or distance is `error`. Several physical roots are all returned.
 *
 * Formulas: Taylor, Classical Mechanics, §2.2 and §5.2; Hecht, Optics (Fraunhofer double
 * slit); Griffiths, Introduction to Quantum Mechanics, 2nd ed., problem 2.33
 * (rectangular barrier).
 */

export type SolveStatus = 'unique' | 'multiple' | 'none' | 'error';

export type UnknownSolution = {
    status: SolveStatus;
    /** Finite roots in the control's unit. Empty when status is `none` or `error`. */
    values: readonly number[];
    unit: string;
    /** Present when status is `none` or `error`. */
    reason?: string;
};

/** Barrier-width slider maximum in the tunnelling template, in µm. Oscillatory roots above this are omitted unless a wider cap is passed. */
const BARRIER_WIDTH_CONTROL_MAX_UM = 0.05;

const GRAVITY = 'm/s²';
const DRAG = 'kg/s';
const SPRING = 'N/m';
const MASS = 'kg';
const DAMPING = 'kg/s';
const WAVELENGTH = 'nm';
const SLIT_SPACING = 'µm';
const SLIT_WIDTH = 'µm';
const VOLTAGE = 'kV';
const BARRIER_HEIGHT = 'eV';
const BARRIER_WIDTH = 'µm';

const H_BAR = 1.054571817e-34; // J·s
const SPEED_OF_LIGHT = 299792458; // m/s
const EV_TO_JOULE = 1.602176634e-19; // J/eV
const PLANCK = 6.62607015e-34; // J·s
const ELECTRON_MASS = 9.1093837015e-31; // kg
const ELEMENTARY_CHARGE = 1.602176634e-19; // C

function invalid(unit: string, reason = 'non-finite'): UnknownSolution {
    return { status: 'error', values: [], unit, reason };
}

function none(unit: string, reason: string): UnknownSolution {
    return { status: 'none', values: [], unit, reason };
}

function unique(unit: string, value: number): UnknownSolution {
    if (!Number.isFinite(value)) return invalid(unit, 'non-finite');
    return { status: 'unique', values: [value], unit };
}

function badNumbers(unit: string, values: readonly number[]): UnknownSolution | null {
    for (const value of values) {
        if (typeof value !== 'number' || !Number.isFinite(value)) return invalid(unit);
    }
    return null;
}

/** Sorted finite roots. Values closer than 1e-9·max(1,|x|) are one root. */
function pack(unit: string, values: readonly number[]): UnknownSolution {
    if (values.some((value) => !Number.isFinite(value))) return invalid(unit, 'non-finite');
    const sorted = [...values].sort((left, right) => left - right);
    const kept: number[] = [];
    for (const value of sorted) {
        const previous = kept[kept.length - 1];
        if (previous !== undefined && Math.abs(value - previous) <= 1e-9 * Math.max(1, Math.abs(value))) continue;
        kept.push(value);
    }
    if (kept.length === 0) return none(unit, 'no-root');
    if (kept.length === 1) return { status: 'unique', values: kept, unit };
    return { status: 'multiple', values: kept, unit };
}

/**
 * g from y(t) = h₀ + v₀ t − ½ g t².
 * With v₀ = 0 this is the hint g = 2(h₀ − y)/t². Unit: m/s².
 */
export function solveFreeFallGravityFromHeight(input: {
    initialHeightM: number;
    initialVelocityMps: number;
    heightM: number;
    timeS: number;
}): UnknownSolution {
    const bad = badNumbers(GRAVITY, [input.initialHeightM, input.initialVelocityMps, input.heightM, input.timeS]);
    if (bad) return bad;
    if (input.timeS < 0) return invalid(GRAVITY, 'out-of-domain');
    if (input.timeS === 0) {
        return input.heightM === input.initialHeightM ? none(GRAVITY, 'indeterminate') : none(GRAVITY, 'inconsistent');
    }
    const drop = input.initialHeightM + input.initialVelocityMps * input.timeS - input.heightM;
    return unique(GRAVITY, (2 * drop) / (input.timeS * input.timeS));
}

/** g from v(t) = v₀ − g t. Unit: m/s². */
export function solveFreeFallGravityFromVelocity(input: {
    initialVelocityMps: number;
    velocityMps: number;
    timeS: number;
}): UnknownSolution {
    const bad = badNumbers(GRAVITY, [input.initialVelocityMps, input.velocityMps, input.timeS]);
    if (bad) return bad;
    if (input.timeS < 0) return invalid(GRAVITY, 'out-of-domain');
    if (input.timeS === 0) {
        return input.velocityMps === input.initialVelocityMps ? none(GRAVITY, 'indeterminate') : none(GRAVITY, 'inconsistent');
    }
    return unique(GRAVITY, (input.initialVelocityMps - input.velocityMps) / input.timeS);
}

/** g from v² = v₀² − 2 g (y − h₀). Unit: m/s². */
export function solveFreeFallGravityFromSpeedSquared(input: {
    initialHeightM: number;
    initialVelocityMps: number;
    heightM: number;
    velocityMps: number;
}): UnknownSolution {
    const bad = badNumbers(GRAVITY, [input.initialHeightM, input.initialVelocityMps, input.heightM, input.velocityMps]);
    if (bad) return bad;
    const fall = input.heightM - input.initialHeightM;
    const speedChange = input.initialVelocityMps ** 2 - input.velocityMps ** 2;
    if (fall === 0) {
        return speedChange === 0 ? none(GRAVITY, 'indeterminate') : none(GRAVITY, 'inconsistent');
    }
    return unique(GRAVITY, speedChange / (2 * fall));
}

/**
 * c from a = −g − (c/m) v, so c = −m (a + g) / v.
 * v = 0 does not determine c. Unit: kg/s, the free-fall drag control.
 */
export function solveFreeFallDragFromAcceleration(input: {
    massKg: number;
    gravity: number;
    accelerationMps2: number;
    velocityMps: number;
}): UnknownSolution {
    const bad = badNumbers(DRAG, [input.massKg, input.gravity, input.accelerationMps2, input.velocityMps]);
    if (bad) return bad;
    if (!(input.massKg > 0)) return invalid(DRAG, 'out-of-domain');
    if (input.velocityMps === 0) {
        return input.accelerationMps2 === -input.gravity ? none(DRAG, 'indeterminate') : none(DRAG, 'inconsistent');
    }
    return unique(DRAG, (-input.massKg * (input.accelerationMps2 + input.gravity)) / input.velocityMps);
}

/**
 * c from the terminal velocity v_t = −m g / c (positive upward, as on the chart).
 * The hint's c = m g / |v_t| is this value when the terminal velocity points down.
 * Unit: kg/s.
 */
export function solveFreeFallDragFromTerminalVelocity(input: {
    massKg: number;
    gravity: number;
    terminalVelocityMps: number;
}): UnknownSolution {
    const bad = badNumbers(DRAG, [input.massKg, input.gravity, input.terminalVelocityMps]);
    if (bad) return bad;
    if (!(input.massKg > 0)) return invalid(DRAG, 'out-of-domain');
    if (input.terminalVelocityMps === 0) {
        return input.gravity === 0 ? none(DRAG, 'indeterminate') : none(DRAG, 'no-finite-drag');
    }
    if (input.gravity === 0) return none(DRAG, 'inconsistent');
    return unique(DRAG, (-input.massKg * input.gravity) / input.terminalVelocityMps);
}

/** k = 4π² m / T² for an undamped oscillator. Unit: N/m. */
export function solveShoSpringFromPeriod(input: { massKg: number; periodS: number }): UnknownSolution {
    const bad = badNumbers(SPRING, [input.massKg, input.periodS]);
    if (bad) return bad;
    if (!(input.massKg > 0) || !(input.periodS > 0)) return invalid(SPRING, 'out-of-domain');
    return unique(SPRING, (4 * Math.PI ** 2 * input.massKg) / input.periodS ** 2);
}

/**
 * k from m a = −k x − c v. With c = 0 this is the hint "the slope of a against x is −k/m".
 * x = 0 does not determine k. Unit: N/m.
 */
export function solveShoSpringFromForce(input: {
    massKg: number;
    positionM: number;
    velocityMps: number;
    accelerationMps2: number;
    dampingKgPerS?: number;
}): UnknownSolution {
    const damping = input.dampingKgPerS ?? 0;
    const bad = badNumbers(SPRING, [input.massKg, input.positionM, input.velocityMps, input.accelerationMps2, damping]);
    if (bad) return bad;
    if (!(input.massKg > 0)) return invalid(SPRING, 'out-of-domain');
    if (input.positionM === 0) {
        const residual = input.massKg * input.accelerationMps2 + damping * input.velocityMps;
        return residual === 0 ? none(SPRING, 'indeterminate') : none(SPRING, 'inconsistent');
    }
    return unique(SPRING, -(input.massKg * input.accelerationMps2 + damping * input.velocityMps) / input.positionM);
}

/** m = k T² / (4π²) for an undamped oscillator. Unit: kg. */
export function solveShoMassFromPeriod(input: { springNm: number; periodS: number }): UnknownSolution {
    const bad = badNumbers(MASS, [input.springNm, input.periodS]);
    if (bad) return bad;
    if (!(input.springNm > 0) || !(input.periodS > 0)) return invalid(MASS, 'out-of-domain');
    return unique(MASS, (input.springNm * input.periodS ** 2) / (4 * Math.PI ** 2));
}

/** m from m a = −k x − c v. a = 0 does not determine m. Unit: kg. */
export function solveShoMassFromForce(input: {
    springNm: number;
    positionM: number;
    velocityMps: number;
    accelerationMps2: number;
    dampingKgPerS?: number;
}): UnknownSolution {
    const damping = input.dampingKgPerS ?? 0;
    const bad = badNumbers(MASS, [input.springNm, input.positionM, input.velocityMps, input.accelerationMps2, damping]);
    if (bad) return bad;
    if (!(input.springNm > 0)) return invalid(MASS, 'out-of-domain');
    if (input.accelerationMps2 === 0) {
        const residual = input.springNm * input.positionM + damping * input.velocityMps;
        return residual === 0 ? none(MASS, 'indeterminate') : none(MASS, 'inconsistent');
    }
    return unique(MASS, -(input.springNm * input.positionM + damping * input.velocityMps) / input.accelerationMps2);
}

/**
 * c = 2 m ln(A₁/A₂) / Δt from two envelope peaks of an underdamped oscillator.
 * Signs do not matter; a non-positive peak is rejected instead of taking log of it.
 * Unit: kg/s.
 */
export function solveShoDampingFromEnvelope(input: {
    massKg: number;
    firstPeakM: number;
    laterPeakM: number;
    deltaTSeconds: number;
}): UnknownSolution {
    const bad = badNumbers(DAMPING, [input.massKg, input.firstPeakM, input.laterPeakM, input.deltaTSeconds]);
    if (bad) return bad;
    if (!(input.massKg > 0) || !(input.deltaTSeconds > 0)) return invalid(DAMPING, 'out-of-domain');
    const first = Math.abs(input.firstPeakM);
    const later = Math.abs(input.laterPeakM);
    if (!(first > 0) || !(later > 0)) return invalid(DAMPING, 'out-of-domain');
    return unique(DAMPING, (2 * input.massKg * Math.log(first / later)) / input.deltaTSeconds);
}

/** c from m a = −k x − c v. v = 0 does not determine c. Unit: kg/s. */
export function solveShoDampingFromForce(input: {
    massKg: number;
    springNm: number;
    positionM: number;
    velocityMps: number;
    accelerationMps2: number;
}): UnknownSolution {
    const bad = badNumbers(DAMPING, [input.massKg, input.springNm, input.positionM, input.velocityMps, input.accelerationMps2]);
    if (bad) return bad;
    if (!(input.massKg > 0) || !(input.springNm > 0)) return invalid(DAMPING, 'out-of-domain');
    if (input.velocityMps === 0) {
        const residual = input.massKg * input.accelerationMps2 + input.springNm * input.positionM;
        return residual === 0 ? none(DAMPING, 'indeterminate') : none(DAMPING, 'inconsistent');
    }
    return unique(DAMPING, -(input.massKg * input.accelerationMps2 + input.springNm * input.positionM) / input.velocityMps);
}

function screenSine(positionMm: number, screenDistanceM: number): number | null {
    const y = positionMm * 1e-3;
    const hypotenuse = Math.hypot(y, screenDistanceM);
    if (!(hypotenuse > 0)) return null;
    return y / hypotenuse;
}

/**
 * λ from d sinθ = n λ, sinθ = y / √(y² + D²).
 * y is in mm (the chart), d in µm, D in m, λ in nm. n is the bright-fringe order, ±1, ±2, …
 * The central fringe (y = 0) is bright for every wavelength.
 */
export function solveWavelengthFromFringe(input: {
    positionMm: number;
    order: number;
    slitSpacingUm: number;
    screenDistanceM: number;
}): UnknownSolution {
    const bad = badNumbers(WAVELENGTH, [input.positionMm, input.order, input.slitSpacingUm, input.screenDistanceM]);
    if (bad) return bad;
    if (!Number.isInteger(input.order) || input.order === 0) return invalid(WAVELENGTH, 'out-of-domain');
    if (!(input.slitSpacingUm > 0) || !(input.screenDistanceM > 0)) return invalid(WAVELENGTH, 'out-of-domain');
    if (input.positionMm === 0) return none(WAVELENGTH, 'indeterminate');
    const sine = screenSine(input.positionMm, input.screenDistanceM);
    if (sine === null) return invalid(WAVELENGTH, 'out-of-domain');
    const lambdaNm = ((input.slitSpacingUm * 1e-6 * sine) / input.order) * 1e9;
    if (!(lambdaNm > 0)) return none(WAVELENGTH, 'out-of-domain');
    return unique(WAVELENGTH, lambdaNm);
}

/**
 * Every wavelength λ = d sinθ / n, n = 1…maxOrder, that puts a bright fringe at this one
 * measured spot. The order is not known, so the roots come back together.
 */
export function solveWavelengthOrders(input: {
    positionMm: number;
    slitSpacingUm: number;
    screenDistanceM: number;
    maxOrder?: number;
}): UnknownSolution {
    const maxOrder = input.maxOrder ?? 20;
    const bad = badNumbers(WAVELENGTH, [input.positionMm, input.slitSpacingUm, input.screenDistanceM, maxOrder]);
    if (bad) return bad;
    if (!Number.isInteger(maxOrder) || maxOrder < 1) return invalid(WAVELENGTH, 'out-of-domain');
    if (!(input.slitSpacingUm > 0) || !(input.screenDistanceM > 0)) return invalid(WAVELENGTH, 'out-of-domain');
    if (input.positionMm === 0) return none(WAVELENGTH, 'indeterminate');
    const sine = screenSine(Math.abs(input.positionMm), input.screenDistanceM);
    if (sine === null || !(sine > 0)) return none(WAVELENGTH, 'indeterminate');
    const leading = input.slitSpacingUm * 1e-6 * sine * 1e9;
    const values: number[] = [];
    for (let order = 1; order <= maxOrder; order++) values.push(leading / order);
    return pack(WAVELENGTH, values);
}

/** λ from the small-angle spacing Δy = λ D / d. Δy in mm, d in µm, D in m, λ in nm. */
export function solveWavelengthFromSpacing(input: {
    fringeSpacingMm: number;
    slitSpacingUm: number;
    screenDistanceM: number;
}): UnknownSolution {
    const bad = badNumbers(WAVELENGTH, [input.fringeSpacingMm, input.slitSpacingUm, input.screenDistanceM]);
    if (bad) return bad;
    if (!(input.slitSpacingUm > 0) || !(input.screenDistanceM > 0)) return invalid(WAVELENGTH, 'out-of-domain');
    if (!(input.fringeSpacingMm > 0)) return none(WAVELENGTH, 'no-root');
    // λ_nm = Δy_mm · d_µm / D_m. The factors 1e-3, 1e-6 and 1e9 cancel.
    return unique(WAVELENGTH, (input.fringeSpacingMm * input.slitSpacingUm) / input.screenDistanceM);
}

/** d from d sinθ = n λ. d comes back in µm. */
export function solveSlitSpacingFromFringe(input: {
    positionMm: number;
    order: number;
    wavelengthNm: number;
    screenDistanceM: number;
}): UnknownSolution {
    const bad = badNumbers(SLIT_SPACING, [input.positionMm, input.order, input.wavelengthNm, input.screenDistanceM]);
    if (bad) return bad;
    if (!Number.isInteger(input.order) || input.order === 0) return invalid(SLIT_SPACING, 'out-of-domain');
    if (!(input.wavelengthNm > 0) || !(input.screenDistanceM > 0)) return invalid(SLIT_SPACING, 'out-of-domain');
    if (input.positionMm === 0) return none(SLIT_SPACING, 'indeterminate');
    const sine = screenSine(input.positionMm, input.screenDistanceM);
    if (sine === null || sine === 0) return none(SLIT_SPACING, 'indeterminate');
    const spacingUm = ((input.order * input.wavelengthNm * 1e-9) / sine) * 1e6;
    if (!(spacingUm > 0)) return none(SLIT_SPACING, 'out-of-domain');
    return unique(SLIT_SPACING, spacingUm);
}

/** Every slit spacing d = n λ / sinθ, n = 1…maxOrder, in µm. */
export function solveSlitSpacingOrders(input: {
    positionMm: number;
    wavelengthNm: number;
    screenDistanceM: number;
    maxOrder?: number;
}): UnknownSolution {
    const maxOrder = input.maxOrder ?? 20;
    const bad = badNumbers(SLIT_SPACING, [input.positionMm, input.wavelengthNm, input.screenDistanceM, maxOrder]);
    if (bad) return bad;
    if (!Number.isInteger(maxOrder) || maxOrder < 1) return invalid(SLIT_SPACING, 'out-of-domain');
    if (!(input.wavelengthNm > 0) || !(input.screenDistanceM > 0)) return invalid(SLIT_SPACING, 'out-of-domain');
    if (input.positionMm === 0) return none(SLIT_SPACING, 'indeterminate');
    const sine = screenSine(Math.abs(input.positionMm), input.screenDistanceM);
    if (sine === null || !(sine > 0)) return none(SLIT_SPACING, 'indeterminate');
    const leading = ((input.wavelengthNm * 1e-9) / sine) * 1e6;
    const values: number[] = [];
    for (let order = 1; order <= maxOrder; order++) values.push(order * leading);
    return pack(SLIT_SPACING, values);
}

/** d from Δy = λ D / d. d in µm. */
export function solveSlitSpacingFromSpacing(input: {
    fringeSpacingMm: number;
    wavelengthNm: number;
    screenDistanceM: number;
}): UnknownSolution {
    const bad = badNumbers(SLIT_SPACING, [input.fringeSpacingMm, input.wavelengthNm, input.screenDistanceM]);
    if (bad) return bad;
    if (!(input.wavelengthNm > 0) || !(input.screenDistanceM > 0)) return invalid(SLIT_SPACING, 'out-of-domain');
    if (!(input.fringeSpacingMm > 0)) return none(SLIT_SPACING, 'no-root');
    return unique(SLIT_SPACING, (input.wavelengthNm * input.screenDistanceM) / input.fringeSpacingMm);
}

/**
 * a from a sinθ = λ, the first zero of the single-slit envelope when |n| = 1.
 * a in µm. y = 0 is the middle of the pattern, not that zero.
 */
export function solveSlitWidthFromEnvelope(input: {
    positionMm: number;
    wavelengthNm: number;
    screenDistanceM: number;
}): UnknownSolution {
    const bad = badNumbers(SLIT_WIDTH, [input.positionMm, input.wavelengthNm, input.screenDistanceM]);
    if (bad) return bad;
    if (!(input.wavelengthNm > 0) || !(input.screenDistanceM > 0)) return invalid(SLIT_WIDTH, 'out-of-domain');
    if (input.positionMm === 0) return none(SLIT_WIDTH, 'indeterminate');
    const sine = screenSine(input.positionMm, input.screenDistanceM);
    if (sine === null || sine === 0) return none(SLIT_WIDTH, 'indeterminate');
    const widthUm = ((input.wavelengthNm * 1e-9) / Math.abs(sine)) * 1e6;
    return unique(SLIT_WIDTH, widthUm);
}

/**
 * Accelerating voltage from the relativistic de Broglie wavelength, in kV.
 * K² + 2 m c² K − p² c² = 0, p = h / λ, U = K / e.
 */
export function solveAcceleratingVoltage(input: { wavelengthNm: number }): UnknownSolution {
    const bad = badNumbers(VOLTAGE, [input.wavelengthNm]);
    if (bad) return bad;
    if (!(input.wavelengthNm > 0)) return invalid(VOLTAGE, 'out-of-domain');
    const momentum = PLANCK / (input.wavelengthNm * 1e-9);
    const rest = ELECTRON_MASS * SPEED_OF_LIGHT ** 2;
    const kinetic = -rest + Math.sqrt(rest * rest + (momentum * SPEED_OF_LIGHT) ** 2);
    return unique(VOLTAGE, kinetic / ELEMENTARY_CHARGE / 1000);
}

type Particle = { energyJ: number; massKg: number };

function particleFromControls(speedOverC: number, massUi: number, unit: string): Particle | UnknownSolution {
    if (!(massUi > 0)) return invalid(unit, 'out-of-domain');
    if (speedOverC < 0 || speedOverC > 1) return invalid(unit, 'out-of-domain');
    const massKg = massUi * 1e5 * EV_TO_JOULE / (SPEED_OF_LIGHT * SPEED_OF_LIGHT);
    const speed = speedOverC * SPEED_OF_LIGHT;
    return { energyJ: 0.5 * massKg * speed * speed, massKg };
}

function isParticle(value: Particle | UnknownSolution): value is Particle {
    return 'energyJ' in value;
}

/** Rectangular-barrier transmission. Private forward model used only to bracket roots. */
function transmissionOf(energyJ: number, barrierJ: number, widthM: number, massKg: number): number {
    if (!(massKg > 0) || barrierJ < 0 || widthM < 0 || !Number.isFinite(energyJ)) return Number.NaN;
    if (barrierJ === 0 || widthM === 0) return 1;
    if (!(energyJ > 0)) return 0;
    const gap = Math.abs(energyJ - barrierJ);
    if (gap <= 1e-12 * Math.max(energyJ, barrierJ)) {
        return 1 / (1 + (massKg * barrierJ * widthM * widthM) / (2 * H_BAR * H_BAR));
    }
    if (energyJ < barrierJ) {
        const kappa = Math.sqrt((2 * massKg * (barrierJ - energyJ)) / (H_BAR * H_BAR));
        const kappaL = kappa * widthM;
        if (kappaL > 300) {
            const logT = -2 * kappaL + Math.log((16 * energyJ * (barrierJ - energyJ)) / (barrierJ * barrierJ));
            return logT >= -745 ? Math.exp(logT) : 0;
        }
        const sinh = Math.sinh(kappaL);
        return 1 / (1 + (barrierJ * barrierJ * sinh * sinh) / (4 * energyJ * (barrierJ - energyJ)));
    }
    const k2 = Math.sqrt((2 * massKg * (energyJ - barrierJ)) / (H_BAR * H_BAR));
    const sine = Math.sin(k2 * widthM);
    return 1 / (1 + (barrierJ * barrierJ * sine * sine) / (4 * energyJ * (energyJ - barrierJ)));
}

function widthBelow(energyJ: number, barrierJ: number, massKg: number, transmission: number): UnknownSolution {
    if (transmission === 1) return unique(BARRIER_WIDTH, 0);
    if (transmission === 0) return none(BARRIER_WIDTH, 'no-finite-barrier');
    const kappa = Math.sqrt((2 * massKg * (barrierJ - energyJ)) / (H_BAR * H_BAR));
    if (!(kappa > 0)) return none(BARRIER_WIDTH, 'no-root');
    const q = (4 * energyJ * (barrierJ - energyJ)) / (barrierJ * barrierJ);
    const ratio = (1 - transmission) / transmission;
    const product = q * ratio;
    const kappaL = product > 1e300 ? 0.5 * Math.log(4 * product) : Math.asinh(Math.sqrt(product));
    return unique(BARRIER_WIDTH, (kappaL / kappa) * 1e6);
}

function widthEqual(energyJ: number, massKg: number, transmission: number): UnknownSolution {
    if (transmission === 1) return unique(BARRIER_WIDTH, 0);
    if (transmission === 0) return none(BARRIER_WIDTH, 'no-finite-barrier');
    const inside = (1 / transmission - 1) * (2 * H_BAR * H_BAR) / (massKg * energyJ);
    if (!(inside >= 0)) return none(BARRIER_WIDTH, 'no-root');
    return unique(BARRIER_WIDTH, Math.sqrt(inside) * 1e6);
}

function widthAbove(
    energyJ: number,
    barrierJ: number,
    massKg: number,
    transmission: number,
    maxUm: number,
): UnknownSolution {
    const k2 = Math.sqrt((2 * massKg * (energyJ - barrierJ)) / (H_BAR * H_BAR));
    if (!(k2 > 0) || !(maxUm > 0)) return none(BARRIER_WIDTH, 'no-root');
    const maxM = maxUm * 1e-6;
    const nCap = Math.floor((k2 * maxM) / Math.PI + 1e-9);
    if (nCap > 100_000) return invalid(BARRIER_WIDTH, 'too-many-roots');
    if (transmission === 1) {
        const roots = [0];
        for (let n = 1; n <= nCap; n++) roots.push(((n * Math.PI) / k2) * 1e6);
        return pack(BARRIER_WIDTH, roots);
    }
    const s = (1 / transmission - 1) * (4 * energyJ * (energyJ - barrierJ)) / (barrierJ * barrierJ);
    if (!Number.isFinite(s) || s < 0 || s > 1) return none(BARRIER_WIDTH, 'no-root');
    const alpha = Math.asin(Math.sqrt(s));
    const roots: number[] = [];
    for (let n = 0; n <= nCap; n++) {
        for (const phase of [n * Math.PI + alpha, (n + 1) * Math.PI - alpha]) {
            if (phase <= 0) continue;
            const widthM = phase / k2;
            if (widthM <= maxM * (1 + 1e-12)) roots.push(widthM * 1e6);
        }
    }
    return pack(BARRIER_WIDTH, roots);
}

function rejectTransmission(unit: string, transmission: number): UnknownSolution | null {
    if (typeof transmission !== 'number' || !Number.isFinite(transmission)) return invalid(unit);
    if (transmission < 0 || transmission > 1) return invalid(unit, 'out-of-domain');
    return null;
}

/**
 * Barrier width L, in µm, from the transmission T.
 * E < V₀ has one width. E > V₀ has a root for every angle k₂ L = nπ ± arcsin(…),
 * reported up to `maxUm` (the control maximum, 0.05 µm, when omitted). T = 0 is not a finite width.
 */
export function solveBarrierWidth(input: {
    transmission: number;
    speedOverC: number;
    massUi: number;
    barrierEv: number;
    maxUm?: number;
}): UnknownSolution {
    const maxUm = input.maxUm ?? BARRIER_WIDTH_CONTROL_MAX_UM;
    const rejected = rejectTransmission(BARRIER_WIDTH, input.transmission);
    if (rejected) return rejected;
    const bad = badNumbers(BARRIER_WIDTH, [input.speedOverC, input.massUi, input.barrierEv, maxUm]);
    if (bad) return bad;
    if (input.barrierEv < 0 || !(maxUm > 0)) return invalid(BARRIER_WIDTH, 'out-of-domain');
    if (input.barrierEv === 0) {
        return input.transmission === 1 ? none(BARRIER_WIDTH, 'indeterminate') : none(BARRIER_WIDTH, 'inconsistent');
    }
    const particle = particleFromControls(input.speedOverC, input.massUi, BARRIER_WIDTH);
    if (!isParticle(particle)) return particle;
    if (!(particle.energyJ > 0)) {
        return input.transmission === 0 ? none(BARRIER_WIDTH, 'indeterminate') : none(BARRIER_WIDTH, 'inconsistent');
    }
    const barrierJ = input.barrierEv * EV_TO_JOULE;
    const scale = Math.max(particle.energyJ, barrierJ);
    if (Math.abs(particle.energyJ - barrierJ) <= 1e-12 * scale) {
        return widthEqual(particle.energyJ, particle.massKg, input.transmission);
    }
    if (particle.energyJ < barrierJ) return widthBelow(particle.energyJ, barrierJ, particle.massKg, input.transmission);
    return widthAbove(particle.energyJ, barrierJ, particle.massKg, input.transmission, maxUm);
}

function heightAboveEnergy(energyJ: number, widthM: number, massKg: number, transmission: number): number | null {
    const atEqual = transmissionOf(energyJ, energyJ, widthM, massKg);
    if (!Number.isFinite(atEqual) || !(transmission < atEqual)) return null;
    let lo = energyJ;
    let hi = energyJ + Math.max(energyJ, EV_TO_JOULE);
    let guard = 0;
    while (transmissionOf(energyJ, hi, widthM, massKg) > transmission) {
        hi *= 2;
        guard += 1;
        if (guard > 80 || !Number.isFinite(hi)) return null;
    }
    if (!(transmissionOf(energyJ, hi, widthM, massKg) <= transmission)) return null;
    for (let step = 0; step < 80; step++) {
        const mid = (lo + hi) / 2;
        if (transmissionOf(energyJ, mid, widthM, massKg) > transmission) lo = mid;
        else hi = mid;
    }
    return (lo + hi) / 2;
}

function heightsBelowEnergy(energyJ: number, widthM: number, massKg: number, transmission: number): number[] | 'overflow' {
    const phiMax = widthM * Math.sqrt((2 * massKg * energyJ) / (H_BAR * H_BAR));
    if (!(phiMax > 0)) return [];
    if (transmission === 1) {
        const nMax = Math.floor(phiMax / Math.PI + 1e-9);
        if (nMax > 100_000) return 'overflow';
        const roots = [0];
        for (let n = 1; n <= nMax; n++) {
            const k2 = (n * Math.PI) / widthM;
            const barrierJ = energyJ - (k2 * k2 * H_BAR * H_BAR) / (2 * massKg);
            if (barrierJ > 0) roots.push(barrierJ);
        }
        return roots;
    }
    const step = Math.PI / 40;
    const count = Math.ceil(phiMax / step);
    if (count > 200_000) return 'overflow';
    const residual = (phi: number): number | null => {
        if (!(phi > 0)) return null;
        const k2 = phi / widthM;
        const barrierJ = energyJ - (k2 * k2 * H_BAR * H_BAR) / (2 * massKg);
        if (!(barrierJ < energyJ)) return null;
        // V₀ → 0 sends the required sin² to infinity, so the residual is negative there.
        // A root tucked against a vanishing barrier still changes sign inside the bracket.
        if (!(barrierJ > 0)) return -Number.MAX_VALUE;
        const required = (1 / transmission - 1) * (4 * energyJ * (energyJ - barrierJ)) / (barrierJ * barrierJ);
        if (!(required >= 0)) return null;
        if (!Number.isFinite(required)) return -Number.MAX_VALUE;
        return Math.sin(phi) ** 2 - required;
    };
    const roots: number[] = [];
    const accept = (phi: number) => {
        const k2 = phi / widthM;
        const barrierJ = energyJ - (k2 * k2 * H_BAR * H_BAR) / (2 * massKg);
        if (!(barrierJ > 0)) return;
        const found = transmissionOf(energyJ, barrierJ, widthM, massKg);
        const error = Math.abs(found - transmission);
        const limit = 1e-8 * Math.max(1, transmission) + 1e-12;
        if (error <= limit) roots.push(barrierJ);
    };
    let previousPhi = Math.min(step, phiMax);
    let previous = residual(previousPhi);
    if (previous !== null && Math.abs(previous) <= 1e-10) accept(previousPhi);
    for (let index = 2; index <= count; index++) {
        const phi = Math.min(phiMax, index * step);
        const current = residual(phi);
        if (previous !== null && current !== null && previous === 0) accept(previousPhi);
        if (previous !== null && current !== null && previous * current < 0) {
            let lo = previousPhi;
            let hi = phi;
            let loValue = previous;
            for (let iteration = 0; iteration < 60; iteration++) {
                const mid = (lo + hi) / 2;
                const midValue = residual(mid);
                if (midValue === null || midValue === 0) {
                    lo = mid;
                    hi = mid;
                    break;
                }
                if (loValue * midValue < 0) hi = mid;
                else {
                    lo = mid;
                    loValue = midValue;
                }
            }
            accept((lo + hi) / 2);
        } else if (current !== null && Math.abs(current) <= 1e-10) {
            accept(phi);
        }
        previousPhi = phi;
        previous = current;
    }
    return roots;
}

/**
 * Barrier height V₀, in eV, from the transmission T.
 * One root sits above the particle energy when the barrier is opaque enough.
 * Further roots sit below it wherever the over-barrier sine matches T.
 * A transmission of 0 is not a finite height. L = 0 transmits for every height.
 */
export function solveBarrierHeight(input: {
    transmission: number;
    speedOverC: number;
    massUi: number;
    widthUm: number;
}): UnknownSolution {
    const rejected = rejectTransmission(BARRIER_HEIGHT, input.transmission);
    if (rejected) return rejected;
    const bad = badNumbers(BARRIER_HEIGHT, [input.speedOverC, input.massUi, input.widthUm]);
    if (bad) return bad;
    if (input.widthUm < 0) return invalid(BARRIER_HEIGHT, 'out-of-domain');
    if (input.widthUm === 0) {
        return input.transmission === 1 ? none(BARRIER_HEIGHT, 'indeterminate') : none(BARRIER_HEIGHT, 'inconsistent');
    }
    const particle = particleFromControls(input.speedOverC, input.massUi, BARRIER_HEIGHT);
    if (!isParticle(particle)) return particle;
    if (!(particle.energyJ > 0)) {
        return input.transmission === 0 ? none(BARRIER_HEIGHT, 'indeterminate') : none(BARRIER_HEIGHT, 'inconsistent');
    }
    if (input.transmission === 0) return none(BARRIER_HEIGHT, 'no-finite-barrier');
    const widthM = input.widthUm * 1e-6;
    const roots: number[] = [];
    const above = heightAboveEnergy(particle.energyJ, widthM, particle.massKg, input.transmission);
    if (above !== null) roots.push(above);
    const atEqual = transmissionOf(particle.energyJ, particle.energyJ, widthM, particle.massKg);
    if (Number.isFinite(atEqual) && Math.abs(atEqual - input.transmission) <= 1e-12 * Math.max(1, input.transmission)) {
        roots.push(particle.energyJ);
    }
    const below = heightsBelowEnergy(particle.energyJ, widthM, particle.massKg, input.transmission);
    if (below === 'overflow') return invalid(BARRIER_HEIGHT, 'too-many-roots');
    roots.push(...below);
    const matched = roots.filter((barrierJ) => {
        const found = transmissionOf(particle.energyJ, barrierJ, widthM, particle.massKg);
        return Math.abs(found - input.transmission) <= 1e-8 * Math.max(1, input.transmission) + 1e-12;
    });
    return pack(BARRIER_HEIGHT, matched.map((barrierJ) => barrierJ / EV_TO_JOULE));
}
