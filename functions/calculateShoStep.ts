// This function is not used, the calculation engines are in the frontend.
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Calculate SHO step or batch of steps

function calculateStep(t, parameters) {
    const { 
        m = 1, 
        k = 10, 
        x0 = 1, 
        v0 = 0, 
        c = 0,
        damping = 0
    } = parameters || {};

    // Convert to numbers
    const m_num = parseFloat(m.toString()) || 1;
    const k_num = parseFloat(k.toString()) || 10;
    const x0_num = parseFloat(x0.toString()) || 1;
    const v0_num = parseFloat(v0.toString()) || 0;
    
    // תמיכה בשני שמות לפרמטר הדעיכה: c או damping
    const damping_num = parseFloat((c || damping)?.toString() || '0') || 0;

    // Calculate natural angular frequency
    const omega0 = Math.sqrt(k_num / m_num);
    const period = 2 * Math.PI / omega0;

    let position;
    let velocity;
    let acceleration;

    if (damping_num === 0) {
        // Simple harmonic motion without damping
        const A = Math.sqrt(x0_num * x0_num + (v0_num / omega0) * (v0_num / omega0));
        const phi = Math.atan2(-v0_num / omega0, x0_num);
        
        position = A * Math.cos(omega0 * t + phi);
        velocity = -A * omega0 * Math.sin(omega0 * t + phi);
        acceleration = -omega0 * omega0 * position;
    } else {
        // Damped harmonic motion
        const gamma = damping_num / (2 * m_num);
        const omega_d = Math.sqrt(Math.abs(omega0 * omega0 - gamma * gamma));
        
        if (omega0 > gamma) {
            // Underdamped
            const A = Math.sqrt(x0_num * x0_num + ((v0_num + gamma * x0_num) / omega_d) * ((v0_num + gamma * x0_num) / omega_d));
            const phi = Math.atan2(-(v0_num + gamma * x0_num) / omega_d, x0_num);
            
            position = A * Math.exp(-gamma * t) * Math.cos(omega_d * t + phi);
            velocity = A * Math.exp(-gamma * t) * (-gamma * Math.cos(omega_d * t + phi) - omega_d * Math.sin(omega_d * t + phi));
        } else if (omega0 === gamma) {
            // Critically damped
            position = (x0_num + (v0_num + gamma * x0_num) * t) * Math.exp(-gamma * t);
            velocity = (v0_num + gamma * x0_num - gamma * (x0_num + (v0_num + gamma * x0_num) * t)) * Math.exp(-gamma * t);
        } else {
            // Overdamped
            const r1 = -gamma + Math.sqrt(gamma * gamma - omega0 * omega0);
            const r2 = -gamma - Math.sqrt(gamma * gamma - omega0 * omega0);
            const c1 = (v0_num - r2 * x0_num) / (r1 - r2);
            const c2 = (r1 * x0_num - v0_num) / (r1 - r2);
            
            position = c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t);
            velocity = c1 * r1 * Math.exp(r1 * t) + c2 * r2 * Math.exp(r2 * t);
        }
        
        acceleration = -k_num * position / m_num - damping_num * velocity / m_num;
    }

    // Energy calculations
    const energy_kinetic = 0.5 * m_num * velocity * velocity;
    const energy_potential = 0.5 * k_num * position * position;
    const energy_total = energy_kinetic + energy_potential;

    return {
        time: t,
        position,
        velocity,
        acceleration,
        energy_kinetic,
        energy_potential,
        energy_total,
        angular_frequency: omega0,
        period
    };
}

Deno.serve(async (req) => {
    try {
        // הסרת בדיקת אימות משתמש שגורמת ל-overhead מיותר
        // הפונקציה הזו היא פשוט חישוב מתמטי שלא צריך הרשאות מיוחדות
        
        const body = await req.json();
        const { time, parameters, startTime, endTime, numPoints } = body;
        
        // תמיכה בשני מצבים: נקודה בודדת או אצווה
        if (startTime !== undefined && endTime !== undefined && numPoints !== undefined) {
            // מצב אצווה - חישוב מספר נקודות
            const dt = (endTime - startTime) / (numPoints - 1);
            const dataPoints = [];
            
            for (let i = 0; i < numPoints; i++) {
                const t = startTime + (i * dt);
                const dataPoint = calculateStep(t, parameters);
                dataPoints.push(dataPoint);
            }
            
            return Response.json({ batch: dataPoints });
        } else if (typeof time === 'number') {
            // מצב נקודה בודדת - תאימות לאחור
            const dataPoint = calculateStep(time, parameters);
            return Response.json(dataPoint);
        } else {
            return Response.json({ 
                error: 'Invalid input: Either provide (time, parameters) or (startTime, endTime, numPoints, parameters)' 
            }, { status: 400 });
        }
        
    } catch (error) {
        console.error('SHO calculation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});