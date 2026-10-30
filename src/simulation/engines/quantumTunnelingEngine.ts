import type { EngineParameters } from './types';
import { finiteOr } from './finiteNumber';
import { freeParticlePhase } from './principalPhase';

/**
 * Quantum tunneling simulation engine with time evolution.
 * All internal calculations are done in SI units (meters, kg, seconds, Joules).
 * Inputs are converted from the user-friendly units defined in the admin form.
 */

// SI Constants
const H_BAR = 1.054571817e-34; // Reduced Planck constant (J·s)
const SPEED_OF_LIGHT = 299792458; // (m/s)
const EV_TO_JOULE = 1.602176634e-19; // (J/eV)

// Unit conversion constants - Updated for new UI units
const UM_TO_METER = 1e-6; // (m/µm) - Micrometer to meter conversion
const EV_PER_C_SQUARED_TO_KG = EV_TO_JOULE / (SPEED_OF_LIGHT * SPEED_OF_LIGHT); // (kg per eV/c²)

// Visual Scaling - Adjusted for lower velocity range (max 0.1c) with improved non-linear scaling
const VISUAL_SPEED_SCALE_FACTOR = 1.5e6; // Further reduced for higher overall speeds

// Detector position on the transmitted (+x) side of the barrier
export const DETECTOR_X_POSITION = 25;

/**
 * Calculates the transmission and reflection coefficients for a quantum particle
 * encountering a rectangular potential barrier.
 * @param {number} E_si - Kinetic energy of the particle (Joules).
 * @param {number} V0_si - Height of the potential barrier (Joules).
 * @param {number} L_si - Width of the potential barrier (meters).
 * @param {number} m_si - Mass of the particle (kg).
 * @returns {{transmission: number, reflection: number}} Transmission and reflection probabilities.
 */
export function calculateTransmissionReflection(E_si: number, V0_si: number, L_si: number, m_si: number) {
    // A negative mass, barrier, or width is not a rectangular barrier we solve.
    // V0 = 0 or L = 0 is no barrier, so the wave is transmitted in full.
    // E = 0 against a real barrier does not transmit.
    if (!(m_si > 0) || V0_si < 0 || L_si < 0) return { transmission: 0, reflection: 1 };
    if (V0_si === 0 || L_si === 0) return { transmission: 1, reflection: 0 };
    if (!(E_si > 0)) return { transmission: 0, reflection: 1 };

    let transmission = 0;
    
    if (E_si < V0_si) {
        // Case E < V0: Quantum tunneling through the barrier
        const kappa_squared = (2 * m_si * (V0_si - E_si)) / (H_BAR * H_BAR);
        const kappa = Math.sqrt(kappa_squared);
        const kappaL = kappa * L_si;
        // sinh(κL) overflows near κL ≈ 350. Past that, sinh(κL) ≈ exp(κL)/2 and
        // T ≈ 16 E (V0 − E) / V0² · exp(−2κL). Cutting the tail off at 50 made
        // a 10^−67 probability look like exactly zero.
        if (kappaL > 300) {
            const logT = -2 * kappaL + Math.log((16 * E_si * (V0_si - E_si)) / (V0_si * V0_si));
            transmission = logT >= -745 ? Math.exp(logT) : 0;
        } else {
            const sinh_kappaL = Math.sinh(kappaL);
            // Standard tunneling formula for rectangular barrier
            const denominator = 1 + (V0_si * V0_si * sinh_kappaL * sinh_kappaL) / (4 * E_si * (V0_si - E_si));
            transmission = 1 / denominator;
        }
    } else if (E_si > V0_si) {
        // Case E > V0: Particle energy exceeds barrier height
        const k1_squared = (2 * m_si * E_si) / (H_BAR * H_BAR);
        const k2_squared = (2 * m_si * (E_si - V0_si)) / (H_BAR * H_BAR);
        const k1 = Math.sqrt(k1_squared);
        const k2 = Math.sqrt(k2_squared);
        
        const k2L = k2 * L_si;
        const sin_k2L = Math.sin(k2L);
        
        // Transmission formula for E > V0
        const numerator = 4 * k1 * k1 * k2 * k2;
        // T = 4k1²k2² / (4k1²k2² + (k1² − k2²)²·sin²(k2·L)), i.e. 1 / (1 + V0²·sin²(k2·L) / (4E(E − V0))).
        // Resonances (T = 1) occur at k2·L = nπ.
        const denominator = numerator + (k1 * k1 - k2 * k2) * (k1 * k1 - k2 * k2) * sin_k2L * sin_k2L;
        transmission = numerator / denominator;
    } else {
        // Case E = V0: limit of both formulas as E → V0: T = 1 / (1 + m·V0·L² / (2ħ²))
        transmission = 1 / (1 + (m_si * V0_si * L_si * L_si) / (2 * H_BAR * H_BAR));
    }

    // Ensure transmission is within valid bounds
    transmission = Math.max(0, Math.min(1, transmission));
    
    const reflection = 1 - transmission;
    return { transmission, reflection };
}

export function calculateQuantumTunnelingStep(t: number, parameters: EngineParameters | null = {}) {
    // Ensure parameters object exists and has default values
    const { 
        v = 0.01,   // Particle speed as fraction of c (non-relativistic default)
        m = 5.11,   // Particle mass in 10^5 eV/c² (UI unit). 5.11 is electron mass.
        V0 = 1.0,   // Barrier height in eV
        L = 0.005,  // Barrier width in µm (micrometers)
        randomSeed,
    } = parameters || {};

    // A zero speed, barrier, or width is physical (rest, no barrier, no thickness).
    // A zero mass is not: the wave number and kinetic energy would be undefined.
    const v_num = finiteOr(v, 0.01);
    const parsedMass = finiteOr(m, 5.11);
    const m_num_ui_unit = parsedMass > 0 ? parsedMass : 5.11;
    const V0_num = finiteOr(V0, 1.0);
    const L_num = finiteOr(L, 0.005);

    // --- Convert user-friendly units to SI units for physics calculations ---
    
    // 1. Mass: Convert from UI unit (10^5 eV/c²) to SI (kg)
    const m_eV_c2 = m_num_ui_unit * 100000; // Convert to actual eV/c²
    const m_si = m_eV_c2 * EV_PER_C_SQUARED_TO_KG; // Convert from eV/c² to kg
    
    // 2. Velocity
    const v_si = v_num * SPEED_OF_LIGHT; // Convert from fraction of c to m/s
    
    // 3. Barrier Height
    const V0_si = V0_num * EV_TO_JOULE;   // Convert from eV to Joules
    
    // 4. Barrier Width
    const L_si = L_num * UM_TO_METER;     // Convert from µm to meters
    
    // Calculate kinetic energy in SI units (non-relativistic)
    const E_si = 0.5 * m_si * v_si * v_si;

    // Calculate transmission and reflection coefficients
    const { transmission, reflection } = calculateTransmissionReflection(E_si, V0_si, L_si, m_si);

    // --- Visual Position Calculation ---
    // Non-linear speed scaling for better visualization across the velocity range (0.01c to 0.1c)
    const MAX_UI_VELOCITY = 0.1; // The maximum velocity settable in the UI
    const POWER_FACTOR = 0.35; // Use 0.35 for stronger compression, boosting lower speeds more

    // The target visual speed at the maximum UI velocity (0.1c)
    const TARGET_MAX_VISUAL_SPEED = (MAX_UI_VELOCITY * SPEED_OF_LIGHT) / VISUAL_SPEED_SCALE_FACTOR;

    // Normalize the current UI velocity (v_num) against the max UI velocity
    // Add a small epsilon to avoid division by zero if MAX_UI_VELOCITY is 0.
    const normalized_v = v_num / (MAX_UI_VELOCITY + 1e-9);

    // Apply the power function to the normalized velocity.
    // This "boosts" the lower end of the speed range visually.
    const scaled_v_for_display = Math.pow(normalized_v, POWER_FACTOR);

    // Calculate the final visual speed.
    const visual_speed = scaled_v_for_display * TARGET_MAX_VISUAL_SPEED;

    let position = -50 + visual_speed * t; 
    position = Math.min(position, 50); // Cap at x = 50

    // --- Quantum Measurement & Wave-Function Collapse ---
    // Once the transmitted wave reaches the detector at DETECTOR_X_POSITION (x = 25),
    // a measurement occurs: the state collapses into 'transmitted' with probability T
    // or 'reflected' with probability R = 1 - T.
    // When randomSeed is not provided (e.g. legacy reconstructed runs),
    // do not trigger a collapse.
    const rawRandom =
        typeof randomSeed === 'number' && !Number.isNaN(randomSeed) ? randomSeed : null;
    const collapseRandom = rawRandom;
    const hasRandom = rawRandom !== null;
    const hasCollapsed = hasRandom && position >= DETECTOR_X_POSITION;
    const measurementResult = hasCollapsed
        ? (rawRandom < transmission ? 'transmitted' : 'reflected')
        : null;

    // φ = kx − ωt, folded into [0, 2π). ω is ~10^16 rad/s, so a double modulo
    // drops the fractional part; freeParticlePhase reduces the exact ratio instead.
    // The wave starts 50 µm left of the origin, where the picture starts too.
    const initial_physical_x_m = -50 * UM_TO_METER;
    const phase = freeParticlePhase(m_eV_c2, v_num, t, initial_physical_x_m);
    
    // The quantum tunneling simulation should stop when the particle has passed the barrier.
    const shouldStop = position >= 50;
    
    return {
        time: t,
        position,
        phase,
        transmission,
        reflection,
        hasCollapsed,
        measurementResult,
        shouldStop,
        // Debug information 
        debug: {
            E_eV: E_si / EV_TO_JOULE,
            V0_eV: V0_num,
            ratio_E_V0: V0_si > 0 ? E_si / V0_si : Infinity,
            barrier_width_um: L_num,
            velocity_fraction_c: v_num,
            mass_eV_per_c2: m_eV_c2, // Show the actual mass in eV/c²
            collapse_random: collapseRandom,
        }
    };
}
