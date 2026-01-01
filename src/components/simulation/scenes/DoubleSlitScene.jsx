import React, { useRef, useEffect } from 'react';

const DoubleSlitScene = ({ dataPointToRender }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !dataPointToRender || !dataPointToRender.pattern) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        const { pattern, parameters } = dataPointToRender;
        const { wavelength = 500 } = parameters;
        
        ctx.clearRect(0, 0, width, height);

        // --- Draw Slits and Screen ---
        const wallX = 100;
        const screenX = width - 100;
        
        // Wall
        ctx.fillStyle = '#475569';
        ctx.fillRect(wallX - 5, 0, 10, height);
        
        // Slits
        ctx.clearRect(wallX - 5, height/2 - 40, 10, 20);
        ctx.clearRect(wallX - 5, height/2 + 20, 10, 20);

        // Screen
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(screenX, 0, 5, height);

        // --- Draw Interference Pattern ---
        if (pattern && pattern.length > 0) {
            const maxIntensity = Math.max(...pattern.map(p => p.intensity));
            const patternHeight = height * 0.8;
            const patternCenterY = height / 2;

            for (let i = 0; i < pattern.length; i++) {
                const point = pattern[i];
                const y = patternCenterY + (point.position / (pattern[pattern.length-1].position * 2.2)) * patternHeight;
                
                // Wavelength to RGB color
                const color = wavelengthToRgb(wavelength);
                const intensity = point.intensity / maxIntensity;

                ctx.beginPath();
                ctx.moveTo(screenX + 5, y);
                ctx.lineTo(screenX + 5 + intensity * 50, y);
                ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${intensity})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

    }, [dataPointToRender]);

    // Helper to convert wavelength (nm) to an RGB color
    function wavelengthToRgb(wavelength) {
        let r, g, b;
        if (wavelength >= 380 && wavelength <= 439) {
            r = -(wavelength - 440) / (440 - 380); g = 0.0; b = 1.0;
        } else if (wavelength >= 440 && wavelength <= 489) {
            r = 0.0; g = (wavelength - 440) / (490 - 440); b = 1.0;
        } else if (wavelength >= 490 && wavelength <= 509) {
            r = 0.0; g = 1.0; b = -(wavelength - 510) / (510 - 490);
        } else if (wavelength >= 510 && wavelength <= 579) {
            r = (wavelength - 510) / (580 - 510); g = 1.0; b = 0.0;
        } else if (wavelength >= 580 && wavelength <= 644) {
            r = 1.0; g = -(wavelength - 645) / (645 - 580); b = 0.0;
        } else if (wavelength >= 645 && wavelength <= 780) {
            r = 1.0; g = 0.0; b = 0.0;
        } else {
            r = 0.0; g = 0.0; b = 0.0;
        }

        const factor = wavelength >= 380 && wavelength <= 780 ? 1.0 : 0.0;
        return [Math.round(255 * r * factor), Math.round(255 * g * factor), Math.round(255 * b * factor)];
    }

    return (
        <div className="w-full h-full bg-slate-100 rounded-lg overflow-hidden">
            <canvas ref={canvasRef} width="800" height="400" className="w-full h-full"></canvas>
        </div>
    );
};

export default React.memo(DoubleSlitScene);