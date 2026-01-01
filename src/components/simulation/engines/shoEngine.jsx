
/**
 * מנוע סימולציה לתנודות הרמוניות פשוטות (SHO)
 */

/**
 * חישוב צעד בודד בסימולציה
 */
export function calculateStep(t, parameters) {
    const { 
        m = 1, 
        k = 10, 
        x0 = 1, 
        v0 = 0, 
        c = 0,
        damping = 0
    } = parameters || {};

    // המרה למספרים
    const m_num = parseFloat(m.toString()) || 1;
    const k_num = parseFloat(k.toString()) || 10;
    const x0_num = parseFloat(x0.toString()) || 1;
    const v0_num = parseFloat(v0.toString()) || 0;
    
    // תמיכה בשני שמות לפרמטר הדעיכה: c או damping
    const damping_num = parseFloat((c || damping)?.toString() || '0') || 0;

    // חישוב תדר זוויתי טבעי
    const omega0 = Math.sqrt(k_num / m_num);
    const period = 2 * Math.PI / omega0;

    let position;
    let velocity;
    let acceleration;

    if (damping_num === 0) {
        // תנודה הרמונית פשוטה ללא דעיכה
        const A = Math.sqrt(x0_num * x0_num + (v0_num / omega0) * (v0_num / omega0));
        const phi = Math.atan2(-v0_num / omega0, x0_num);
        
        position = A * Math.cos(omega0 * t + phi);
        velocity = -A * omega0 * Math.sin(omega0 * t + phi);
        acceleration = -omega0 * omega0 * position;
    } else {
        // תנודה הרמונית עם דעיכה
        const gamma = damping_num / (2 * m_num);
        const omega_d = Math.sqrt(Math.abs(omega0 * omega0 - gamma * gamma));
        
        if (omega0 > gamma) {
            // דעיכה חלשה (Underdamped)
            // שינוי קטן: אם omega_d קרוב ל-0 (כאשר omega0 קרוב ל-gamma), למנוע חלוקה באפס
            const current_omega_d = omega_d === 0 ? 1e-9 : omega_d; // למנוע חלוקה באפס אם יש דעיכה קריטית/חזקה מאוד
            const A = Math.sqrt(x0_num * x0_num + ((v0_num + gamma * x0_num) / current_omega_d) * ((v0_num + gamma * x0_num) / current_omega_d));
            const phi = Math.atan2(-(v0_num + gamma * x0_num) / current_omega_d, x0_num);
            
            position = A * Math.exp(-gamma * t) * Math.cos(omega_d * t + phi);
            velocity = A * Math.exp(-gamma * t) * (-gamma * Math.cos(omega_d * t + phi) - omega_d * Math.sin(omega_d * t + phi));
        } else if (omega0 === gamma) {
            // דעיכה קריטית (Critically damped)
            position = (x0_num + (v0_num + gamma * x0_num) * t) * Math.exp(-gamma * t);
            velocity = (v0_num + gamma * x0_num - gamma * (x0_num + (v0_num + gamma * x0_num) * t)) * Math.exp(-gamma * t);
        } else {
            // דעיכה חזקה (Overdamped)
            const discriminant = gamma * gamma - omega0 * omega0;
            // וודא שהשורש הריבועי הוא ממספר חיובי
            const sqrt_discriminant = Math.sqrt(Math.max(0, discriminant)); 
            
            const r1 = -gamma + sqrt_discriminant;
            const r2 = -gamma - sqrt_discriminant;
            
            // למנוע חלוקה באפס אם r1 ו r2 זהים במקרה גבולי
            const diff_r = r1 - r2;
            const c1 = (diff_r === 0) ? 0 : (v0_num - r2 * x0_num) / diff_r;
            const c2 = (diff_r === 0) ? 0 : (r1 * x0_num - v0_num) / diff_r;
            
            position = c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t);
            velocity = c1 * r1 * Math.exp(r1 * t) + c2 * r2 * Math.exp(r2 * t);
        }
        
        // חישוב תאוצה עבור כל מקרי הדעיכה
        acceleration = -k_num * position / m_num - damping_num * velocity / m_num;
    }

    // חישובי אנרגיה
    const energy_kinetic = 0.5 * m_num * velocity * velocity;
    const energy_potential = 0.5 * k_num * position * position;
    const energy_total = energy_kinetic + energy_potential;

    // לוגיקה לקביעת מתי הסימולציה צריכה להיעצר
    let shouldStop = false;
    if (damping_num > 0) {
        // עבור מערכות מדוכאות (Damped systems), הסימולציה יכולה להיעצר כאשר המערכת מגיעה למצב מנוחה קרוב לשיווי משקל.
        // נגדיר סף קטן מאוד עבור מיקום ומהירות.
        const SETTLING_THRESHOLD = 1e-6; // סף קטן, ניתן לשקול להפוך אותו לפרמטר מתכוונן או יחסי לגודל ההתחלתי
        if (Math.abs(position) < SETTLING_THRESHOLD && Math.abs(velocity) < SETTLING_THRESHOLD) {
            shouldStop = true;
        }
    }
    // עבור מערכות ללא דעיכה (undamped SHO), shouldStop נשאר false,
    // שכן תנודה הרמונית אידיאלית נמשכת ללא הפסק.
    // הסימולציה תסתיים במקרה זה לפי t_max בלבד (או הפסקה חיצונית).


    return {
        time: t,
        position,
        velocity,
        acceleration,
        energy_kinetic,
        energy_potential,
        energy_total,
        angular_frequency: omega0,
        period,
        shouldStop: shouldStop // ערך זה נקבע על פי הלוגיקה החדשה
    };
}
