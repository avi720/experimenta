// This function is not used, the calculation engines are in the frontend.
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * @typedef {Object} FreeFallParameters
 * @property {number} h0 - Initial height in meters
 * @property {number} v0 - Initial velocity in m/s (positive = upward)
 * @property {number} g - Gravitational acceleration in m/s²
 * @property {number} m - Mass in kg
 * @property {boolean} [air_resistance] - Air resistance on/off
 * @property {number} [drag_coefficient] - Air drag coefficient
 */

/**
 * @typedef {Object} FreeFallDataPoint
 * @property {number} time
 * @property {number} position
 * @property {number} velocity
 * @property {number} acceleration
 * @property {number} energy_kinetic
 * @property {number} energy_potential
 * @property {number} [energy_total]
 */

/**
 * Calculate free fall step
 * @param {number} t - Time
 * @param {FreeFallParameters} parameters - Simulation parameters
 * @returns {FreeFallDataPoint}
 */
function calculateStep(t, parameters) {
    const { h0 = 100, v0 = 0, g = 9.81, m = 1, air_resistance = false, drag_coefficient = 0.47 } = parameters || {};

    // Convert to numbers to handle string inputs from UI
    const h0_num = parseFloat(h0.toString()) || 100;
    const v0_num = parseFloat(v0.toString()) || 0;
    const g_num = parseFloat(g.toString()) || 9.81;
    const m_num = parseFloat(m.toString()) || 1;

    let position;
    let velocity;
    let acceleration;

    if (!air_resistance) {
        // Simple free fall without air resistance
        position = h0_num + v0_num * t - 0.5 * g_num * t * t;
        velocity = v0_num - g_num * t;
        acceleration = -g_num;
    } else {
        // With air resistance - simplified model
        const drag_coeff = parseFloat(drag_coefficient?.toString() || '0.47') || 0.47;
        const terminal_velocity = Math.sqrt((2 * m_num * g_num) / drag_coeff);
        
        // Approximate solution for drag force proportional to v²
        const time_factor = Math.tanh(t * g_num / terminal_velocity);
        velocity = v0_num * Math.exp(-t * drag_coeff / m_num) - terminal_velocity * time_factor;
        position = h0_num + v0_num * t - 0.5 * terminal_velocity * terminal_velocity * Math.log(Math.cosh(t * g_num / terminal_velocity)) / g_num;
        acceleration = -g_num + (drag_coeff / m_num) * velocity * Math.abs(velocity);
    }

    // Ensure object doesn't go below ground
    position = Math.max(0, position);
    
    // If object hits ground, velocity becomes zero
    if (position <= 0) {
        velocity = 0;
        acceleration = 0;
    }

    // Energy calculations
    const energy_kinetic = 0.5 * m_num * velocity * velocity;
    const energy_potential = m_num * g_num * position;
    const energy_total = energy_kinetic + energy_potential;

    return {
        time: t,
        position,
        velocity,
        acceleration,
        energy_kinetic,
        energy_potential,
        energy_total
    };
}

Deno.serve(async (req) => {
    try {
        // הסרת בדיקת אימות משתמש שגורמת ל-overhead מיותר
        
        const body = await req.json();
        const { time, parameters } = body;
        
        if (typeof time !== 'number' || !parameters) {
            return Response.json({ error: 'Invalid input: time and parameters required' }, { status: 400 });
        }
        
        const dataPoint = calculateStep(time, parameters);
        
        return Response.json(dataPoint);
    } catch (error) {
        console.error('Free fall calculation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});