/**
 * Double-slit interference for light or for electrons.
 *
 * Both sources obey the same wave optics; only the wavelength differs:
 * - light (an electromagnetic wave): λ is the chosen wavelength;
 * - electrons: λ is the de Broglie wavelength λ = h / p of an electron accelerated through U,
 *   with the relativistic momentum p = √(2·mₑ·e·U·(1 + e·U / (2·mₑ·c²))).
 *
 * Two slits of width a, centre to centre d apart, lit by a plane wave, give on a screen at
 * distance D (Fraunhofer):
 *   I(θ) = cos²(π·d·sinθ / λ) · sinc²(π·a·sinθ / λ),   sinθ = x / √(x² + D²),
 * the two-slit interference fringes (spacing λ·D/d) inside the single-slit diffraction envelope
 * (first zeros at x ≈ ±λ·D/a).
 *
 * The screen window adapts to the pattern, so the fringes are always resolved: it spans the
 * central envelope and its first side lobes, capped at 20 fringes on each side.
 */
import type { EngineParameters } from './types';

export const PLANCK = 6.62607015e-34; // J·s
export const ELECTRON_MASS = 9.1093837015e-31; // kg
export const ELEMENTARY_CHARGE = 1.602176634e-19; // C
export const SPEED_OF_LIGHT = 299792458; // m/s

export type DoubleSlitSource = 'light' | 'electron';

export type DoubleSlitPoint = {
    /** Position on the screen, mm from the centre line. */
    position: number;
    /** Relative intensity (light) or detection probability density (electrons), peak 1. */
    intensity: number;
};

const DEFAULTS = {
    wavelength: 532, // nm, green laser
    accelerating_voltage: 50, // kV
    slit_spacing: 250, // µm
    slit_width: 50, // µm
    screen_distance: 1, // m
};
const NUM_POINTS = 1201;
const MAX_FRINGES_PER_SIDE = 20;
/** Before the template had a slit width, the engine sampled a fixed 5 cm screen. */
const LEGACY_HALF_WIDTH_M = 0.025;

function readPositive(parameters: EngineParameters, key: string, fallback: number) {
    const parsed = parseFloat(String(parameters[key]));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function readSource(parameters: EngineParameters): DoubleSlitSource {
    return parameters.source === 'electron' ? 'electron' : 'light';
}

/** De Broglie wavelength (m) of an electron accelerated from rest through `volts`. */
export function electronWavelength(volts: number): number {
    const energy = ELEMENTARY_CHARGE * volts;
    const restEnergy = ELECTRON_MASS * SPEED_OF_LIGHT ** 2;
    const momentum = Math.sqrt(2 * ELECTRON_MASS * energy * (1 + energy / (2 * restEnergy)));
    return PLANCK / momentum;
}

/** The wavelength (m) that reaches the slits for these parameters. */
export function sourceWavelength(parameters: EngineParameters): number {
    if (readSource(parameters) === 'electron') {
        return electronWavelength(readPositive(parameters, 'accelerating_voltage', DEFAULTS.accelerating_voltage) * 1000);
    }
    return readPositive(parameters, 'wavelength', DEFAULTS.wavelength) * 1e-9;
}

/** sin(x) / x, with its limit 1 at x = 0. */
function sinc(x: number) {
    return Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x;
}

export function calculateInterference(parameters: EngineParameters): DoubleSlitPoint[] {
    const lambda = sourceWavelength(parameters);
    const D = readPositive(parameters, 'screen_distance', DEFAULTS.screen_distance);

    // Templates from before the slit width was added stored the separation in nm under
    // `slit_separation` and modelled ideal narrow slits on a fixed 5 cm screen. Runs saved with
    // that key keep the old model even though the registry defaults now add `slit_spacing`.
    const legacySeparation = parseFloat(String(parameters.slit_separation));
    const isLegacy = Number.isFinite(legacySeparation) && legacySeparation > 0;

    let d: number;
    let a: number;
    let halfWidth: number;
    if (isLegacy) {
        d = legacySeparation * 1e-9;
        a = 0;
        halfWidth = LEGACY_HALF_WIDTH_M;
    } else {
        d = readPositive(parameters, 'slit_spacing', DEFAULTS.slit_spacing) * 1e-6;
        // Two slits wider than their spacing would overlap into one opening.
        a = Math.min(readPositive(parameters, 'slit_width', DEFAULTS.slit_width) * 1e-6, d);
        const fringe = (lambda * D) / d;
        const envelope = (lambda * D) / a;
        halfWidth = Math.min(1.5 * envelope, MAX_FRINGES_PER_SIDE * fringe);
        // Keep the window inside ±80° so wide-angle patterns stay on a flat screen.
        halfWidth = Math.min(halfWidth, D * Math.tan((80 * Math.PI) / 180));
    }

    const pattern: DoubleSlitPoint[] = [];
    for (let i = 0; i < NUM_POINTS; i++) {
        const x = -halfWidth + (2 * halfWidth * i) / (NUM_POINTS - 1);
        const sinTheta = x / Math.hypot(x, D);
        const interference = Math.cos((Math.PI * d * sinTheta) / lambda) ** 2;
        const diffraction = sinc((Math.PI * a * sinTheta) / lambda) ** 2;
        pattern.push({
            position: x * 1000,
            intensity: interference * diffraction,
        });
    }
    return pattern;
}

/**
 * Draws `count` detection positions (mm) from the pattern, each with probability proportional
 * to its intensity (the Born rule for electrons, photon counting for light). `random` returns
 * uniform numbers in [0, 1); pass a seeded one for repeatable runs.
 */
export function sampleDetections(
    pattern: ReadonlyArray<DoubleSlitPoint>,
    count: number,
    random: () => number
): number[] {
    if (pattern.length < 2 || count <= 0) return [];
    // Cumulative distribution over the sample intervals (trapezoid areas).
    const cumulative = new Float64Array(pattern.length);
    for (let i = 1; i < pattern.length; i++) {
        const width = pattern[i].position - pattern[i - 1].position;
        cumulative[i] = cumulative[i - 1] + ((pattern[i].intensity + pattern[i - 1].intensity) / 2) * width;
    }
    const total = cumulative[pattern.length - 1];
    if (!(total > 0)) return [];

    const hits: number[] = [];
    for (let n = 0; n < count; n++) {
        const target = random() * total;
        let lo = 1;
        let hi = pattern.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (cumulative[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        const span = cumulative[lo] - cumulative[lo - 1];
        const t = span > 0 ? (target - cumulative[lo - 1]) / span : 0.5;
        hits.push(pattern[lo - 1].position + t * (pattern[lo].position - pattern[lo - 1].position));
    }
    return hits;
}
