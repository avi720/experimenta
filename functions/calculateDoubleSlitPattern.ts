// This function is not used, the calculation engines are in the frontend.
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * @typedef {Object} DoubleSlitParameters
 * @property {number} wavelength - Wavelength in nm
 * @property {number} slit_separation - Distance between slits in nm
 * @property {number} screen_distance - Distance to screen in m
 * @property {number} [slit_width] - Individual slit width in nm
 */

/**
 * @typedef {Object} DoubleSlitDataPoint
 * @property {number} x - Position on screen (mm)
 * @property {number} intensity - Normalized intensity (0-1)
 * @property {number} phase - Phase at this point
 */

/**
 * Calculate double slit interference pattern
 * @param {DoubleSlitParameters} parameters - Simulation parameters
 * @returns {DoubleSlitDataPoint[]}
 */
function calculateInterference(parameters) {
    const { wavelength = 500, slit_separation = 2000, screen_distance = 1, slit_width = 200 } = parameters || {};

    // Convert to numbers and appropriate units
    const lambda_nm = parseFloat(wavelength.toString()) || 500; // wavelength in nm
    const lambda_m = lambda_nm * 1e-9; // convert to meters
    const d_nm = parseFloat(slit_separation.toString()) || 2000; // slit separation in nm
    const d_m = d_nm * 1e-9; // convert to meters
    const L_m = parseFloat(screen_distance.toString()) || 1; // screen distance in meters
    const w_nm = parseFloat(slit_width?.toString() || '200') || 200; // slit width in nm
    const w_m = w_nm * 1e-9; // convert to meters

    const pattern = [];
    const numPoints = 500; // Number of points across the screen
    const screenWidth_mm = 50; // Screen width in mm (±25mm from center)
    
    for (let i = 0; i < numPoints; i++) {
        // Position on screen in mm
        const x_mm = (i - numPoints/2) * screenWidth_mm / numPoints;
        const x_m = x_mm * 1e-3; // convert to meters
        
        // Angle from center
        const theta = Math.atan(x_m / L_m);
        const sin_theta = Math.sin(theta);
        
        // Path difference between the two slits
        const delta = d_m * sin_theta;
        
        // Phase difference
        const phase_diff = (2 * Math.PI * delta) / lambda_m;
        
        // Single slit diffraction envelope (if slit width is specified)
        let envelope = 1;
        if (w_m > 0) {
            const beta = (Math.PI * w_m * sin_theta) / lambda_m;
            if (Math.abs(beta) > 1e-10) {
                envelope = Math.sin(beta) / beta;
                envelope = envelope * envelope; // Square for intensity
            }
        }
        
        // Double slit interference
        const interference = Math.cos(phase_diff / 2);
        const intensity = envelope * interference * interference;
        
        // Normalize intensity to [0,1]
        const normalizedIntensity = Math.max(0, intensity);
        
        pattern.push({
            x: x_mm,
            intensity: normalizedIntensity,
            phase: phase_diff
        });
    }
    
    // Normalize all intensities to the maximum found
    const maxIntensity = Math.max(...pattern.map(p => p.intensity));
    if (maxIntensity > 0) {
        pattern.forEach(p => {
            p.intensity = p.intensity / maxIntensity;
        });
    }
    
    return pattern;
}

Deno.serve(async (req) => {
    try {
        // הסרת בדיקת אימות משתמש שגורמת ל-overhead מיותר
        // (The base44 client is no longer needed since auth.me() is removed)
        
        const body = await req.json();
        const { parameters } = body;
        
        if (!parameters) {
            return Response.json({ error: 'Invalid input: parameters required' }, { status: 400 });
        }
        
        const pattern = calculateInterference(parameters);
        
        return Response.json(pattern);
    } catch (error) {
        console.error('Double slit calculation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
