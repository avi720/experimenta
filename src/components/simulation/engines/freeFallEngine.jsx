/**
 * Free Fall Physics Engine
 * מנוע חישוב לנפילה חופשית
 */

/**
 * מחשב צעד בודד של סימולציית נפילה חופשית
 * @param {number} t - הזמן הנוכחי
 * @param {Object} parameters - פרמטרי הסימולציה
 * @returns {Object} נתוני הצעד
 */
export function calculateFreeFallStep(t, parameters) {
    console.log("calculateFreeFallStep called with:", { t, parameters });
    const { 
        h0 = 50,      // גובה התחלתי [m]
        v0 = 0,       // מהירות התחלתית [m/s]
        g = 9.81,     // תאוצת כבידה [m/s²]
        m = 1,        // מסה [kg]
        c = 0         // מקדם גרר [kg/s]
    } = parameters || {};

    // המרה למספרים
    const h0_num = parseFloat(h0) || 50;
    const v0_num = parseFloat(v0) || 0;
    const g_num = parseFloat(g) || 9.81;
    const m_num = parseFloat(m) || 1;
    const c_num = parseFloat(c) || 0;

    let y, velocity, acceleration;

    if (c_num === 0) {
        // נפילה חופשית ללא התנגדות אוויר
        y = h0_num + v0_num * t - 0.5 * g_num * t * t;
        velocity = v0_num - g_num * t;
        acceleration = -g_num;
    } else {
        // עם התנגדות אוויר (דעיכה מעריכית)
        const gamma = c_num / m_num;
        const v_terminal = -m_num * g_num / c_num;
        
        const exp_term = Math.exp(-gamma * t);
        velocity = v_terminal + (v0_num - v_terminal) * exp_term;
        
        // אינטגרציה של המהירות למיקום
        y = h0_num + v_terminal * t + ((v0_num - v_terminal) / gamma) * (1 - exp_term);
        
        acceleration = -g_num + (c_num / m_num) * velocity;
    }

    // וידוא שהגוף לא יורד מתחת לקרקע
    y = Math.max(0, y);
    
    if (y <= 0) {
        velocity = 0;
        acceleration = 0;
    }

    // חישובי אנרגיה
    const energy_kinetic = 0.5 * m_num * velocity * velocity;
    const energy_potential = m_num * g_num * y;
    const energy_total = energy_kinetic + energy_potential;

    // קביעה אם הסימולציה צריכה להיפסק
    // הסימולציה תיעצר כאשר הגוף הגיע לקרקע ונח
    const shouldStop = y <= 0 && Math.abs(velocity) < 0.001;

    const result = {
        time: t,
        position: {
            y: y
        },
        velocity: velocity,
        acceleration: acceleration,
        energy_kinetic: energy_kinetic,
        energy_potential: energy_potential,
        energy_total: energy_total,
        shouldStop: shouldStop
    };
    console.log("calculateFreeFallStep returning:", result);
    return result;
}