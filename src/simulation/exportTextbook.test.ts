import { describe, expect, it } from "vitest";
import { EXPERIMENT_REGISTRY } from "@/simulation/experimentRegistry";
import { DETECTOR_X_POSITION } from "@/simulation/engines/quantumTunnelingEngine";
import {
    collectSimulationSamples,
    getSampleDt,
} from "@/hooks/simulation/useSimulationEngineLogic";
import {
    exportStoredSamplesCsv,
    exportWorkspaceCsv,
    parseStoredSimulationSamples,
    serializeSimulationSamples,
    storedSampleIndices,
} from "@/lib/simulationExport";
import type { SimulationStepFn, TimeSample } from "@/types/simulation";
import type { EngineParameters } from "@/simulation/engines/types";

/**
 * Locks the CSV a student downloads — the workspace Export button and the Results
 * export of a saved run — against the closed-form textbook result for every experiment.
 *
 * Headers are the quantity names. The CSV does not print units; each column's unit is
 * locked by the exact string below, and the numbers are checked in those units.
 * Ordinary cells are written with `toFixed(6)`, so a correct value can differ from the
 * formula by half a unit in the last place, plus a few ulps. A non-zero value smaller
 * than that (a thick-barrier transmission) is written in scientific notation and is
 * checked relatively, because an absolute 5×10⁻⁷ would accept 0.
 */
const CSV_ABSOLUTE = 5e-7;

function exportTolerance(expected: number): number {
    return CSV_ABSOLUTE + 4 * Number.EPSILON * Math.max(1, Math.abs(expected));
}

function withinExportTolerance(error: number, expected: number): boolean {
    if (error <= exportTolerance(expected)) return true;
    return expected !== 0 && Math.abs(expected) < CSV_ABSOLUTE && error <= 1e-6 * Math.abs(expected);
}

const COVERED_SLUGS = ["double-slit", "free-fall", "quantum-tunneling", "sho"];

type Column = { readonly name: string; readonly unit: string };

const FREE_FALL_COLUMNS = [
    { name: "time", unit: "s" },
    { name: "position", unit: "m" },
    { name: "velocity", unit: "m/s" },
    { name: "acceleration", unit: "m/s²" },
    { name: "energy_kinetic", unit: "J" },
    { name: "energy_potential", unit: "J" },
    { name: "energy_total", unit: "J" },
] as const satisfies readonly Column[];

const SHO_COLUMNS = [
    ...FREE_FALL_COLUMNS,
    { name: "angular_frequency", unit: "rad/s" },
    { name: "period", unit: "s" },
] as const satisfies readonly Column[];

const TUNNEL_COLUMNS = [
    { name: "time", unit: "s" },
    { name: "position", unit: "scene" },
    { name: "phase", unit: "rad" },
    { name: "transmission", unit: "1" },
    { name: "reflection", unit: "1" },
    { name: "hasCollapsed", unit: "boolean" },
    { name: "measurementResult", unit: "label" },
] as const satisfies readonly Column[];

const DOUBLE_SLIT_COLUMNS = [
    { name: "position", unit: "mm" },
    { name: "intensity", unit: "1" },
] as const satisfies readonly Column[];

function unitsExact(columns: readonly Column[]): string {
    return columns.map((column) => `${column.name} [${column.unit}]`).join(",");
}

function parseCsv(csv: string): { header: string[]; rows: string[][] } {
    const lines = csv.split("\n");
    return {
        header: lines[0]?.split(",") ?? [],
        rows: lines.slice(1).filter((line) => line.length > 0).map((line) => line.split(",")),
    };
}

function lockColumns(header: string[], columns: readonly Column[]) {
    expect(header).toEqual(columns.map((column) => column.name));
    expect(unitsExact(columns)).toBe(columns.map((column) => `${column.name} [${column.unit}]`).join(","));
    // The unit spellings are part of the contract, written out so a rename cannot hide in the helper.
    expect(unitsExact(columns)).toBe(
        columns === FREE_FALL_COLUMNS
            ? "time [s],position [m],velocity [m/s],acceleration [m/s²],energy_kinetic [J],energy_potential [J],energy_total [J]"
            : columns === SHO_COLUMNS
              ? "time [s],position [m],velocity [m/s],acceleration [m/s²],energy_kinetic [J],energy_potential [J],energy_total [J],angular_frequency [rad/s],period [s]"
              : columns === TUNNEL_COLUMNS
                ? "time [s],position [scene],phase [rad],transmission [1],reflection [1],hasCollapsed [boolean],measurementResult [label]"
                : "position [mm],intensity [1]",
    );
}

function columnMisses(
    rows: string[][],
    header: string[],
    name: string,
    expectedAt: (row: number) => number,
    delta: (actual: number, expected: number) => number = (actual, expected) => Math.abs(actual - expected),
): string[] {
    const index = header.indexOf(name);
    const misses: string[] = [];
    if (index < 0) return [`missing column ${name}`];
    rows.forEach((row, rowIndex) => {
        const actual = Number(row[index]);
        const expected = expectedAt(rowIndex);
        const error = delta(actual, expected);
        if (!withinExportTolerance(error, expected) && misses.length < 5) {
            misses.push(`row ${rowIndex}: csv ${row[index]} vs textbook ${expected} (Δ=${error})`);
        }
    });
    return misses;
}

function textMisses(
    rows: string[][],
    header: string[],
    name: string,
    expectedAt: (row: number) => string,
): string[] {
    const index = header.indexOf(name);
    const misses: string[] = [];
    if (index < 0) return [`missing column ${name}`];
    rows.forEach((row, rowIndex) => {
        const actual = row[index] ?? "";
        const expected = expectedAt(rowIndex);
        if (actual !== expected && misses.length < 5) {
            misses.push(`row ${rowIndex}: csv "${actual}" vs "${expected}"`);
        }
    });
    return misses;
}

function phaseCell(row: string[], header: string[]): number {
    return Number(row[header.indexOf("phase")]);
}

/**
 * The exported phase is φ(t) = [φ(0) + ω t] mod 2π, with φ(0) = (k x0) mod 2π
 * and x0 = −50 µm. ω is about 4×10^16 rad/s, so ω × ulp(t) is ~0.04 rad on the
 * sample grid: a double cannot check the advance. φ(0) can, because k x0 is
 * only ~10^6 rad. The reduction for later times is `freeParticlePhase`.
 */
function phaseAnchorMisses(rows: string[][], header: string[], speedOverC: number, massUi: number): string[] {
    if (rows.length === 0) return ["no phase samples"];
    const phase0 = phaseAtRest(speedOverC, massUi);
    const exported0 = phaseCell(rows[0], header);
    const anchor = Math.abs(exported0 - phase0);
    if (anchor > exportTolerance(phase0)) {
        return [`t = 0: csv ${exported0} vs (k x0) mod 2π ${phase0} (Δ=${anchor})`];
    }
    const misses: string[] = [];
    rows.forEach((row, index) => {
        const phase = phaseCell(row, header);
        if ((!(phase >= 0) || phase >= 2 * Math.PI) && misses.length < 5) {
            misses.push(`row ${index}: phase ${phase} is outside [0, 2π)`);
        }
    });
    return misses;
}

type RowCheck = (
    rows: string[][],
    header: string[],
    timeAt: (row: number) => number,
    sourceIndex: (row: number) => number,
) => void;

function expectBothExports(raw: readonly object[], columns: readonly Column[], check: RowCheck) {
    const workspace = parseCsv(exportWorkspaceCsv(raw));
    const stored = parseStoredSimulationSamples(JSON.stringify(serializeSimulationSamples(raw)));
    expect(stored).not.toBeNull();
    const saved = parseCsv(exportStoredSamplesCsv(stored));
    lockColumns(workspace.header, columns);
    lockColumns(saved.header, columns);

    expect(workspace.rows).toHaveLength(raw.length);
    check(
        workspace.rows,
        workspace.header,
        (row) => Number((raw[row] as TimeSample).time),
        (row) => row,
    );

    const indices = storedSampleIndices(raw.length);
    expect(saved.rows).toHaveLength(indices.length);
    check(
        saved.rows,
        saved.header,
        (row) => Number((raw[indices[row]] as TimeSample).time),
        (row) => indices[row],
    );
}

async function collectRun(
    step: SimulationStepFn,
    parameters: EngineParameters,
    maxTime: number,
    sampleDt: number,
): Promise<TimeSample[]> {
    const raw: TimeSample[] = [];
    const outcome = await collectSimulationSamples(step, parameters, maxTime, sampleDt, raw);
    expect(outcome).toBe("complete");
    expect(raw[0]?.time).toBe(0);
    expect(raw[1]?.time).toBeCloseTo(sampleDt, 12);
    expect(raw[raw.length - 1].time).toBeGreaterThan(raw[raw.length - 2].time);
    return raw;
}

// --- Textbook references (independent of the engines) ---

// y positive upward. Taylor, Classical Mechanics, §2.2–2.4: with linear drag F = −c v,
// m v' = −m g − c v, so v(t) = v_t + (v0 − v_t) e^{−(c/m) t}, v_t = −m g / c.
type Fall = { h0: number; v0: number; g: number; m: number; c: number };

function fallAt(t: number, { h0, v0, g, m, c }: Fall) {
    if (c === 0) {
        const velocity = v0 - g * t;
        const y = h0 + v0 * t - 0.5 * g * t * t;
        return kinematics(y, velocity, -g, m, g);
    }
    const gamma = c / m;
    const terminal = -g / gamma;
    const velocity = terminal + (v0 - terminal) * Math.exp(-gamma * t);
    const y = h0 + terminal * t + ((v0 - terminal) / gamma) * (1 - Math.exp(-gamma * t));
    return kinematics(y, velocity, -g - gamma * velocity, m, g);
}

function kinematics(y: number, velocity: number, acceleration: number, m: number, g: number) {
    const kinetic = 0.5 * m * velocity * velocity;
    const potential = m * g * y;
    return { y, velocity, acceleration, kinetic, potential, total: kinetic + potential };
}

// Taylor, Classical Mechanics, §5.2. γ = c / (2m), ω0 = √(k/m).
type Sho = { m: number; k: number; c: number; x0: number; v0: number };

function shoAt(t: number, { m, k, c, x0, v0 }: Sho) {
    const omega0 = Math.sqrt(k / m);
    let x: number;
    let velocity: number;
    if (c === 0) {
        const amplitude = Math.hypot(x0, v0 / omega0);
        const phi = Math.atan2(-v0 / omega0, x0);
        x = amplitude * Math.cos(omega0 * t + phi);
        velocity = -amplitude * omega0 * Math.sin(omega0 * t + phi);
    } else {
        const gamma = c / (2 * m);
        const discriminant = omega0 * omega0 - gamma * gamma;
        if (Math.abs(discriminant) < 1e-12) {
            const slope = v0 + gamma * x0;
            const decay = Math.exp(-gamma * t);
            x = (x0 + slope * t) * decay;
            velocity = (slope - gamma * (x0 + slope * t)) * decay;
        } else if (discriminant > 0) {
            const omegaD = Math.sqrt(discriminant);
            const decay = Math.exp(-gamma * t);
            const sine = (v0 + gamma * x0) / omegaD;
            x = decay * (x0 * Math.cos(omegaD * t) + sine * Math.sin(omegaD * t));
            velocity =
                -gamma * x +
                decay * (-x0 * omegaD * Math.sin(omegaD * t) + sine * omegaD * Math.cos(omegaD * t));
        } else {
            const root = Math.sqrt(-discriminant);
            const r1 = -gamma + root;
            const r2 = -gamma - root;
            const c1 = (v0 - r2 * x0) / (r1 - r2);
            const c2 = (r1 * x0 - v0) / (r1 - r2);
            x = c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t);
            velocity = c1 * r1 * Math.exp(r1 * t) + c2 * r2 * Math.exp(r2 * t);
        }
    }
    const acceleration = -(k / m) * x - (c / m) * velocity;
    const kinetic = 0.5 * m * velocity * velocity;
    const potential = 0.5 * k * x * x;
    return {
        x,
        velocity,
        acceleration,
        kinetic,
        potential,
        total: kinetic + potential,
        omega0,
        period: (2 * Math.PI) / omega0,
    };
}

// Griffiths, Introduction to Quantum Mechanics, 2nd ed., eq. 2.169: rectangular barrier.
const HBAR = 1.054571817e-34; // J·s, CODATA 2018
const ELEMENTARY = 1.602176634e-19; // J/eV, exact
const LIGHT = 299792458; // m/s, exact

function barrierTransmission(speedOverC: number, massUi: number, barrierEv: number, widthUm: number): number {
    const mass = massUi * 1e5 * ELEMENTARY / (LIGHT * LIGHT);
    const energy = 0.5 * mass * (speedOverC * LIGHT) ** 2;
    const height = barrierEv * ELEMENTARY;
    const width = widthUm * 1e-6;
    if (energy < height) {
        const kappa = Math.sqrt(2 * mass * (height - energy)) / HBAR;
        const sinh = Math.sinh(kappa * width);
        return 1 / (1 + (height * height * sinh * sinh) / (4 * energy * (height - energy)));
    }
    if (energy > height) {
        const k2 = Math.sqrt(2 * mass * (energy - height)) / HBAR;
        const sine = Math.sin(k2 * width);
        return 1 / (1 + (height * height * sine * sine) / (4 * energy * (energy - height)));
    }
    return 1 / (1 + (mass * height * width * width) / (2 * HBAR * HBAR));
}

// On-screen coordinate of the packet. Not a length: the scene maps speed to a display
// rate so a slow electron still crosses the picture. Locked so it cannot be mistaken for metres.
function scenePosition(speedOverC: number, t: number): number {
    const maxUiSpeed = 0.1;
    const target = (maxUiSpeed * LIGHT) / 1.5e6;
    const scaled = (speedOverC / (maxUiSpeed + 1e-9)) ** 0.35;
    return Math.min(-50 + scaled * target * t, 50);
}

/**
 * φ(0) = (k x0) mod 2π with x0 = −50 µm. k x0 is about 10^6 rad, so a double
 * still has a fractional part. φ(t) − φ(0) = ωt mod 2π is not recomputed here:
 * ω ~ 4×10^16 rad/s and ωt at a sample does not fit in a double. The export is
 * checked for this φ(0) and for a constant advance. The reduction itself is
 * `freeParticlePhase` (CODATA decimals, 50-digit π).
 */
function phaseAtRest(speedOverC: number, massUi: number): number {
    const mass = massUi * 1e5 * ELEMENTARY / (LIGHT * LIGHT);
    const speed = speedOverC * LIGHT;
    let phase = ((mass * speed) / HBAR) * (-50e-6);
    const twoPi = 2 * Math.PI;
    phase %= twoPi;
    return phase < 0 ? phase + twoPi : phase;
}

// Hecht, Optics: Fraunhofer double slit, I = cos²(π d sinθ / λ) sinc²(π a sinθ / λ),
// sinθ = x / √(x² + D²). Electrons use the relativistic de Broglie wavelength.
const PLANCK = 6.62607015e-34; // J·s, exact
const ELECTRON_MASS = 9.1093837015e-31; // kg, CODATA 2018

function electronWavelengthMetres(kilovolts: number): number {
    const kinetic = ELEMENTARY * kilovolts * 1000;
    const rest = ELECTRON_MASS * LIGHT * LIGHT;
    const momentum = Math.sqrt(2 * ELECTRON_MASS * kinetic * (1 + kinetic / (2 * rest)));
    return PLANCK / momentum;
}

function screenHalfWidth(lambda: number, spacing: number, width: number, distance: number): number {
    const fringe = (lambda * distance) / spacing;
    const envelope = (lambda * distance) / width;
    return Math.min(1.5 * envelope, 20 * fringe, distance * Math.tan((80 * Math.PI) / 180));
}

function slitIntensity(xMetres: number, lambda: number, spacing: number, width: number, distance: number): number {
    const sinTheta = xMetres / Math.hypot(xMetres, distance);
    const interference = Math.cos((Math.PI * spacing * sinTheta) / lambda) ** 2;
    const diffractionArgument = (Math.PI * width * sinTheta) / lambda;
    const sinc = diffractionArgument === 0 ? 1 : Math.sin(diffractionArgument) / diffractionArgument;
    return interference * sinc * sinc;
}

describe("export fixtures cover the catalogue", () => {
    it("locks every registered experiment", () => {
        expect(Object.values(EXPERIMENT_REGISTRY).map((entry) => entry.slug).sort()).toEqual(COVERED_SLUGS);
    });
});

describe("free fall export", () => {
    // Vacuum: y = h0 + v0 t − ½ g t². g = 10 m/s² is inside the control range, so the
    // drop from 80 m released from rest lands at t = 4 s with v = −40 m/s.
    const vacuum: Fall = { h0: 80, v0: 0, g: 10, m: 2, c: 0 };
    const drag: Fall = { h0: 80, v0: 0, g: 10, m: 2, c: 0.4 };

    async function exportFall(params: Fall) {
        const maxTime = EXPERIMENT_REGISTRY.freeFall.defaultMaxTime ?? 0;
        expect(maxTime).toBe(60);
        const sampleDt = getSampleDt(maxTime);
        expect(sampleDt).toBe(0.02);
        const raw = await collectRun(EXPERIMENT_REGISTRY.freeFall.calculateStepFn, params, maxTime, sampleDt);
        expect(raw.at(-1)?.shouldStop).toBe(true);
        return raw;
    }

    function expectFallColumns(raw: TimeSample[], params: Fall) {
        expectBothExports(raw, FREE_FALL_COLUMNS, (rows, header, timeAt) => {
            expect(columnMisses(rows, header, "time", timeAt)).toEqual([]);
            expect(columnMisses(rows, header, "position", (row) => fallAt(timeAt(row), params).y)).toEqual([]);
            expect(columnMisses(rows, header, "velocity", (row) => fallAt(timeAt(row), params).velocity)).toEqual([]);
            expect(columnMisses(rows, header, "acceleration", (row) => fallAt(timeAt(row), params).acceleration)).toEqual([]);
            expect(columnMisses(rows, header, "energy_kinetic", (row) => fallAt(timeAt(row), params).kinetic)).toEqual([]);
            expect(columnMisses(rows, header, "energy_potential", (row) => fallAt(timeAt(row), params).potential)).toEqual([]);
            expect(columnMisses(rows, header, "energy_total", (row) => fallAt(timeAt(row), params).total)).toEqual([]);
        });
    }

    it("matches the vacuum kinematic equations, including the impact row", async () => {
        const raw = await exportFall(vacuum);
        const last = raw[raw.length - 1];
        expect(last.time).toBeCloseTo(4, 8);
        expect(last.velocity).toBeCloseTo(-40, 6);
        expect(fallAt(0, vacuum).total).toBe(1600);
        expectFallColumns(raw, vacuum);
    });

    it("matches linear drag y(t) and v(t), and mechanical energy is not conserved", async () => {
        const raw = await exportFall(drag);
        const firstTotal = Number(raw[0].energy_total);
        const lastTotal = Number(raw[raw.length - 1].energy_total);
        expect(lastTotal).toBeLessThan(firstTotal);
        const terminal = -drag.g / (drag.c / drag.m);
        expect(Math.abs(Number(raw[raw.length - 1].velocity))).toBeLessThan(Math.abs(terminal));
        expectFallColumns(raw, drag);
    });

    it("converges to the vacuum drop through the first-order drag correction as c → 0", async () => {
        // Independent of the engine's expm1 form: y ≈ y_vacuum − γ (v0 t²/2 − g t³/6).
        // At c = 1e-6 the cancelled closed form is already off by ~0.2 mm.
        const params: Fall = { h0: 80, v0: 0, g: 9.81, m: 1, c: 1e-6 };
        const raw = await exportFall(params);
        expectBothExports(raw, FREE_FALL_COLUMNS, (rows, header, timeAt) => {
            const gamma = params.c / params.m;
            const yOf = (t: number) => {
                const vacuum = params.h0 + params.v0 * t - 0.5 * params.g * t * t;
                return vacuum - gamma * ((params.v0 * t * t) / 2 - (params.g * t * t * t) / 6);
            };
            const vOf = (t: number) => {
                const vacuum = params.v0 - params.g * t;
                return vacuum - gamma * (params.v0 * t - (params.g * t * t) / 2);
            };
            expect(columnMisses(rows, header, "position", (row) => yOf(timeAt(row)))).toEqual([]);
            expect(columnMisses(rows, header, "velocity", (row) => vOf(timeAt(row)))).toEqual([]);
        });
    });

    it("matches a throw from the ground, h0 = 0", async () => {
        const params: Fall = { h0: 0, v0: 10, g: 10, m: 1, c: 0 };
        const raw = await exportFall(params);
        expect(raw[0].position).toEqual({ y: 0 });
        expect(raw.at(-1)?.time).toBeCloseTo(2, 8);
        expect(raw.at(-1)?.velocity).toBeCloseTo(-10, 6);
        expectFallColumns(raw, params);
    });

    it("matches an upward throw with linear drag", async () => {
        const params: Fall = { h0: 5, v0: 12, g: 10, m: 1, c: 0.4 };
        const raw = await exportFall(params);
        expect(Number(raw[1].velocity)).toBeGreaterThan(0);
        expect(raw.at(-1)?.shouldStop).toBe(true);
        expectFallColumns(raw, params);
    });
});

describe("harmonic oscillator export", () => {
    const released: Sho = { m: 1, k: 4, c: 0, x0: 1, v0: 0 };
    const pushedFromEquilibrium: Sho = { m: 1, k: 4, c: 0, x0: 0, v0: 2 };
    const underdamped: Sho = { m: 1, k: 4, c: 0.4, x0: 1, v0: 0.5 };

    async function exportSho(params: Sho) {
        const maxTime = EXPERIMENT_REGISTRY.sho.defaultMaxTime ?? 0;
        expect(maxTime).toBe(20);
        const sampleDt = getSampleDt(maxTime);
        expect(sampleDt).toBe(0.005);
        return collectRun(EXPERIMENT_REGISTRY.sho.calculateStepFn, params, maxTime, sampleDt);
    }

    function expectShoColumns(raw: TimeSample[], params: Sho) {
        expectBothExports(raw, SHO_COLUMNS, (rows, header, timeAt) => {
            const at = (row: number) => shoAt(timeAt(row), params);
            expect(columnMisses(rows, header, "time", timeAt)).toEqual([]);
            expect(columnMisses(rows, header, "position", (row) => at(row).x)).toEqual([]);
            expect(columnMisses(rows, header, "velocity", (row) => at(row).velocity)).toEqual([]);
            expect(columnMisses(rows, header, "acceleration", (row) => at(row).acceleration)).toEqual([]);
            expect(columnMisses(rows, header, "energy_kinetic", (row) => at(row).kinetic)).toEqual([]);
            expect(columnMisses(rows, header, "energy_potential", (row) => at(row).potential)).toEqual([]);
            expect(columnMisses(rows, header, "energy_total", (row) => at(row).total)).toEqual([]);
            expect(columnMisses(rows, header, "angular_frequency", (row) => at(row).omega0)).toEqual([]);
            expect(columnMisses(rows, header, "period", (row) => at(row).period)).toEqual([]);
        });
    }

    it("matches x = x0 cos(ω0 t) and conserves ½kx0²", async () => {
        const raw = await exportSho(released);
        expect(raw[raw.length - 1].time).toBeCloseTo(20, 9);
        expect(shoAt(0, released).total).toBe(2);
        expect(shoAt(0, released).period).toBeCloseTo(Math.PI, 12);
        expectShoColumns(raw, released);
    });

    it("matches x = (v0/ω0) sin(ω0 t) when the mass is released from equilibrium", async () => {
        const raw = await exportSho(pushedFromEquilibrium);
        expect(shoAt(0.3, pushedFromEquilibrium).x).toBeCloseTo(Math.sin(0.6), 12);
        expectShoColumns(raw, pushedFromEquilibrium);
    });

    it("matches the underdamped solution x = e^{−γt} (A cos ωd t + B sin ωd t)", async () => {
        const raw = await exportSho(underdamped);
        expectShoColumns(raw, underdamped);
    });

    it("matches critical damping x = (A + Bt) e^{−γt}", async () => {
        // c = 2√(km) = 4, so γ = ω0 = 2.
        const params: Sho = { m: 1, k: 4, c: 4, x0: 1, v0: 0.5 };
        const raw = await exportSho(params);
        expectShoColumns(raw, params);
    });

    it("matches the overdamped solution x = C1 e^{r1 t} + C2 e^{r2 t}", async () => {
        const params: Sho = { m: 1, k: 4, c: 8, x0: 1, v0: 0 };
        const raw = await exportSho(params);
        expectShoColumns(raw, params);
    });

    it("stays at rest when x0 = v0 = 0", async () => {
        const params: Sho = { m: 1, k: 4, c: 0, x0: 0, v0: 0 };
        const raw = await exportSho(params);
        expect(raw.every((point) => point.position === 0 && point.velocity === 0)).toBe(true);
        expectShoColumns(raw, params);
    });
});

describe("quantum tunneling export", () => {
    const aboveBarrier = { v: 0.01, m: 5.11, V0: 1, L: 0.005, randomSeed: 0.25 };
    // E = ½ (0.5×10⁵ eV/c²) (0.01c)² = 2.5 eV under a 10 eV barrier 0.2 nm wide.
    // κL ≈ 0.88, so T is about 0.43, and v = 0.01c still reaches the detector within 10 s.
    const tunneling = { v: 0.01, m: 0.5, V0: 10, L: 0.0002, randomSeed: 0.25 };

    async function exportTunnel(params: typeof aboveBarrier) {
        const maxTime = EXPERIMENT_REGISTRY.quantumTunneling.defaultMaxTime ?? 0;
        expect(maxTime).toBe(10);
        const sampleDt = getSampleDt(maxTime);
        expect(sampleDt).toBe(0.005);
        expect(DETECTOR_X_POSITION).toBe(25);
        return collectRun(EXPERIMENT_REGISTRY.quantumTunneling.calculateStepFn, params, maxTime, sampleDt);
    }

    function expectTunnelColumns(raw: TimeSample[], params: typeof aboveBarrier) {
        const transmission = barrierTransmission(params.v, params.m, params.V0, params.L);
        expect(transmission).toBeGreaterThan(0);
        expect(transmission).toBeLessThanOrEqual(1);
        expectBothExports(raw, TUNNEL_COLUMNS, (rows, header, timeAt) => {
            expect(columnMisses(rows, header, "time", timeAt)).toEqual([]);
            expect(columnMisses(rows, header, "position", (row) => scenePosition(params.v, timeAt(row)))).toEqual([]);
            expect(phaseAnchorMisses(rows, header, params.v, params.m)).toEqual([]);
            expect(columnMisses(rows, header, "transmission", () => transmission)).toEqual([]);
            expect(columnMisses(rows, header, "reflection", () => 1 - transmission)).toEqual([]);
            expect(
                textMisses(rows, header, "hasCollapsed", (row) =>
                    scenePosition(params.v, timeAt(row)) >= 25 ? "true" : "false",
                ),
            ).toEqual([]);
            expect(
                textMisses(rows, header, "measurementResult", (row) => {
                    if (scenePosition(params.v, timeAt(row)) < 25) return "";
                    return params.randomSeed < transmission ? "transmitted" : "reflected";
                }),
            ).toEqual([]);
        });
    }

    it("matches transmission over a barrier (E > V0) and a seeded collapse", async () => {
        const raw = await exportTunnel(aboveBarrier);
        expect(barrierTransmission(aboveBarrier.v, aboveBarrier.m, aboveBarrier.V0, aboveBarrier.L)).toBeGreaterThan(0.99);
        expect(raw.some((point) => point.measurementResult === "transmitted" || point.measurementResult === "reflected")).toBe(true);
        expectTunnelColumns(raw, aboveBarrier);
    });

    it("matches tunneling through a barrier (E < V0)", async () => {
        const transmission = barrierTransmission(tunneling.v, tunneling.m, tunneling.V0, tunneling.L);
        const mass = tunneling.m * 1e5 * ELEMENTARY / (LIGHT * LIGHT);
        const energy = 0.5 * mass * (tunneling.v * LIGHT) ** 2;
        expect(energy).toBeLessThan(tunneling.V0 * ELEMENTARY);
        expect(transmission).toBeGreaterThan(0.2);
        expect(transmission).toBeLessThan(0.7);
        const raw = await exportTunnel(tunneling);
        expectTunnelColumns(raw, tunneling);
    });

    it("matches the E = V0 limit", async () => {
        // ½ (5.11×10^5 eV/c²) v² = 1 eV ⇒ v = √(2/5.11e5).
        const speed = Math.sqrt(2 / (5.11 * 1e5));
        const params = { v: speed, m: 5.11, V0: 1, L: 0.001, randomSeed: 0.25 };
        const raw = await exportTunnel(params);
        expect(barrierTransmission(params.v, params.m, params.V0, params.L)).toBeGreaterThan(0.01);
        expect(barrierTransmission(params.v, params.m, params.V0, params.L)).toBeLessThan(0.99);
        expectTunnelColumns(raw, params);
    });

    it("exports T = 1 at a transmission resonance k2 L = π", async () => {
        const speed = 0.002;
        const massUi = 5.11;
        const barrier = 1;
        const mass = massUi * 1e5 * ELEMENTARY / (LIGHT * LIGHT);
        const energy = 0.5 * mass * (speed * LIGHT) ** 2;
        const height = barrier * ELEMENTARY;
        const k2 = Math.sqrt(2 * mass * (energy - height)) / HBAR;
        const widthUm = (Math.PI / k2) * 1e6;
        const params = { v: speed, m: massUi, V0: barrier, L: widthUm, randomSeed: 0.25 };
        const raw = await exportTunnel(params);
        expect(barrierTransmission(params.v, params.m, params.V0, params.L)).toBeCloseTo(1, 6);
        expectTunnelColumns(raw, params);
    });

    it("matches ln T ≈ −2κL + ln(16 E (V0−E) / V0²) for a thick barrier", async () => {
        // 2 nm barrier, electron at 0.002c, V0 = 10 eV. κL ≈ 31, T ≈ 3×10^−27,
        // which toFixed(6) would have written as 0.000000.
        const params = { v: 0.002, m: 5.11, V0: 10, L: 0.002, randomSeed: 0.25 };
        const raw = await exportTunnel(params);
        const mass = params.m * 1e5 * ELEMENTARY / (LIGHT * LIGHT);
        const energy = 0.5 * mass * (params.v * LIGHT) ** 2;
        const height = params.V0 * ELEMENTARY;
        const width = params.L * 1e-6;
        const kappaL = Math.sqrt(2 * mass * (height - energy)) / HBAR * width;
        const logExpected = -2 * kappaL + Math.log((16 * energy * (height - energy)) / (height * height));
        expect(kappaL).toBeGreaterThan(20);
        const csv = exportWorkspaceCsv(raw);
        const transmission = Number(csv.split("\n")[1]?.split(",")[3]);
        expect(transmission).toBeGreaterThan(0);
        expect(csv.split("\n")[1]).toContain("e-");
        expect(Math.abs(Math.log(transmission) - logExpected)).toBeLessThan(1e-4);
        expectTunnelColumns(raw, params);
    });
});

describe("double slit export", () => {
    const POINTS = 1201;

    function expectPattern(
        params: EngineParameters,
        lambda: number,
        spacingMetres: number,
        widthMetres: number,
        distance: number,
    ) {
        const pattern = EXPERIMENT_REGISTRY.doubleSlit.calculateStaticFn(params);
        expect(pattern).toHaveLength(POINTS);
        const half = screenHalfWidth(lambda, spacingMetres, widthMetres, distance);
        const xAt = (index: number) => -half + (2 * half * index) / (POINTS - 1);
        expectBothExports(pattern, DOUBLE_SLIT_COLUMNS, (rows, header, _timeAt, sourceIndex) => {
            expect(columnMisses(rows, header, "position", (row) => xAt(sourceIndex(row)) * 1000)).toEqual([]);
            expect(
                columnMisses(rows, header, "intensity", (row) =>
                    slitIntensity(xAt(sourceIndex(row)), lambda, spacingMetres, widthMetres, distance),
                ),
            ).toEqual([]);
        });
        expect(slitIntensity(0, lambda, spacingMetres, widthMetres, distance)).toBeCloseTo(1, 12);
    }

    it("matches Young's fringes inside the single-slit envelope for green light", () => {
        const params = { source: "light", wavelength: 532, slit_spacing: 250, slit_width: 50, screen_distance: 1 };
        expectPattern(params, 532e-9, 250e-6, 50e-6, 1);
    });

    it("matches the same pattern for 50 kV electrons at the relativistic de Broglie wavelength", () => {
        const params = {
            source: "electron",
            accelerating_voltage: 50,
            slit_spacing: 1,
            slit_width: 0.2,
            screen_distance: 1,
        };
        const lambda = electronWavelengthMetres(50);
        expect(lambda * 1e12).toBeCloseTo(5.355, 2);
        expectPattern(params, lambda, 1e-6, 0.2e-6, 1);
    });
});
