/**
 * Free Fall Physics Engine
 * מנוע חישוב לנפילה חופשית
 */

/**
 * ממיר קלט (מספר או מחרוזת מה-UI) למספר; ערך ברירת המחדל משמש רק כשהקלט אינו מספר תקין.
 * כך h0 = 0 או v0 = 0 נשארים 0 ולא מוחלפים בברירת המחדל.
 */
function toNumber(value, fallback) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * מצב קינמטי אנליטי (ללא התחשבות בקרקע) בזמן t.
 * גרר לינארי: F = -c·v, ולכן a = -g - (c/m)·v — הגרר תמיד מנוגד למהירות.
 */
function kinematicsAt(t, { h0, v0, g, m, c }) {
    if (c === 0) {
        return {
            y: h0 + v0 * t - 0.5 * g * t * t,
            velocity: v0 - g * t,
            acceleration: -g,
        };
    }

    const gamma = c / m;
    const v_terminal = -g / gamma; // = -m·g/c
    const exp_term = Math.exp(-gamma * t);
    const velocity = v_terminal + (v0 - v_terminal) * exp_term;

    return {
        // אינטגרציה של המהירות למיקום
        y: h0 + v_terminal * t + ((v0 - v_terminal) / gamma) * (1 - exp_term),
        velocity,
        acceleration: -g - gamma * velocity,
    };
}

/**
 * זמן הגעת הגוף לשיא הגובה (0 אם הוא לא נע כלפי מעלה בתחילת התנועה).
 * מאותו רגע הגובה יורד באופן מונוטוני.
 */
function apexTime({ v0, g, m, c }) {
    if (v0 <= 0 || g <= 0) return 0;
    if (c === 0) return v0 / g;
    const gamma = c / m;
    return Math.log(1 + (v0 * gamma) / g) / gamma;
}

/**
 * מוצא את רגע הפגיעה בקרקע (y = 0) בתוך [tLow, tHigh] בחיפוש בינארי,
 * כאשר y(tLow) >= 0 ו-y(tHigh) <= 0.
 */
function findImpactTime(tLow, tHigh, physics) {
    let low = tLow;
    let high = tHigh;
    for (let i = 0; i < 100 && high - low > 1e-12; i++) {
        const mid = (low + high) / 2;
        if (kinematicsAt(mid, physics).y > 0) {
            low = mid;
        } else {
            high = mid;
        }
    }
    return high;
}

/**
 * מחשב צעד בודד של סימולציית נפילה חופשית
 * @param {number} t - הזמן הנוכחי
 * @param {Object} parameters - פרמטרי הסימולציה
 * @returns {Object} נתוני הצעד
 */
export function calculateFreeFallStep(t, parameters) {
    const { 
        h0 = 50,      // גובה התחלתי [m]
        v0 = 0,       // מהירות התחלתית [m/s]
        g = 9.81,     // תאוצת כבידה [m/s²]
        m = 1,        // מסה [kg]
        c = 0         // מקדם גרר [kg/s]
    } = parameters || {};

    // המרה למספרים
    const mass = toNumber(m, 1);
    const physics = {
        h0: Math.max(0, toNumber(h0, 50)),
        v0: toNumber(v0, 0),
        g: toNumber(g, 9.81),
        m: mass > 0 ? mass : 1,
        c: Math.max(0, toNumber(c, 0)),
    };

    let time = t;
    let { y, velocity, acceleration } = kinematicsAt(t, physics);
    let shouldStop = false;

    // הגוף פגע בקרקע: מחזירים את המצב ברגע הפגיעה עצמו (כולל מהירות הפגיעה),
    // ולא מצב "נח" עם מהירות 0, כדי שמהירות ואנרגיית הפגיעה יישמרו בנתונים.
    // (y = 0 עם מהירות כלפי מעלה הוא זריקה מהקרקע, לא פגיעה.)
    if (y < 0 || (y === 0 && velocity <= 0)) {
        const tApex = Math.min(apexTime(physics), t);
        time = findImpactTime(tApex, t, physics);
        ({ velocity, acceleration } = kinematicsAt(time, physics));
        y = 0;
        shouldStop = true;
    }

    // חישובי אנרגיה
    const energy_kinetic = 0.5 * physics.m * velocity * velocity;
    const energy_potential = physics.m * physics.g * y;
    const energy_total = energy_kinetic + energy_potential;

    return {
        time,
        position: {
            y
        },
        velocity,
        acceleration,
        energy_kinetic,
        energy_potential,
        energy_total,
        // הסימולציה נעצרת בנקודת הפגיעה בקרקע
        shouldStop
    };
}
