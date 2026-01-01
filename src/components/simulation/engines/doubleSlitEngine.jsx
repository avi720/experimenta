/**
 * Calculates the interference pattern for a double-slit experiment.
 */
export function calculateInterference(parameters) {
    const lambda = (parseFloat(parameters.wavelength) || 500) * 1e-9; // wavelength in m
    const d = (parseFloat(parameters.slit_separation) || 2000) * 1e-9; // slit separation in m
    const D = parseFloat(parameters.screen_distance) || 1.0; // screen distance in m

    const pattern = [];
    const screen_width = 0.05; // 5 cm screen width
    const num_points = 500;
    
    for (let i = 0; i < num_points; i++) {
        const x = -screen_width / 2 + (i * screen_width) / (num_points - 1);
        const theta = Math.atan(x / D);
        
        // Path difference phase
        const phase_difference = (2 * Math.PI * d * Math.sin(theta)) / lambda;
        
        // Intensity calculation
        const intensity = Math.pow(Math.cos(phase_difference / 2), 2);

        pattern.push({
            position: x * 1000, // position in mm
            intensity: intensity,
        });
    }

    return pattern;
}