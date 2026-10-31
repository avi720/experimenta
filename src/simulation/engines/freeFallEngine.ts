import type { EngineParameters, ParameterValue } from './types';

type FreeFallPhysics = { h0: number; v0: number; g: number; m: number; c: number };

/**
 * Free Fall Physics Engine
 * מנוע חישוב לנפילה חופשית
 */

/**
 * ממיר קלט (מספר או מחרוזת מה-UI) למספר; ערך ברירת המחדל משמש רק כשהקלט אינו מספר תקין.
 * כך h0 = 0 או v0 = 0 נשארים 0 ולא מוחלפים בברירת המחדל.
 */
function toNumber(value: ParameterValue, fallback: number): number {
    const parsed = parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * מצב קינמטי אנליטי (ללא התחשבות בקרקע) בזמן t.
 * גרר לינארי: F = -c·v, ולכן a = -g - (c/m)·v — הגרר תמיד מנוגד למהירות.
 */
function vacuumAt(t: number, h0: number, v0: number, g: number) {
    const velocity = v0 - g * t;
    return {
        y: h0 + v0 * t - 0.5 * g * t * t,
        velocity,
        acceleration: -g,
    };
}

/**
 * Linear drag with y upward: v = v0 e^{−γt} − (g/γ)(1 − e^{−γt}), γ = c/m.
 * The expanded form v_t + (v0 − v_t)e^{−γt} with v_t = −g/γ cancels two huge
 * terms as c → 0. Rewrite with x = γt:
 *   (1 − e^{−x})/x and (1 − e^{−x} − x)/x²,
 * which stay finite (1 and −1/2) and are evaluated with expm1, or with the
 * Taylor series when x is small.
 */
function dragAt(t: number, h0: number, v0: number, g: number, gamma: number) {
    const x = gamma * t;
    if (!(x > 0)) {
        // Drag still acts on the initial velocity: a(0) = −g − γ v0.
        return { y: h0, velocity: v0, acceleration: -g - gamma * v0 };
    }

    let oneMinusExpOverX: number;
    let positionCoeff: number;
    if (x < 1e-3) {
        const x2 = x * x;
        const x3 = x2 * x;
        const x4 = x2 * x2;
        oneMinusExpOverX = 1 - x / 2 + x2 / 6 - x3 / 24 + x4 / 120;
        positionCoeff = -0.5 + x / 6 - x2 / 24 + x3 / 120 - x4 / 720;
    } else {
        const em1 = Math.expm1(-x);
        oneMinusExpOverX = -em1 / x;
        positionCoeff = -(x + em1) / (x * x);
    }

    const velocity = v0 * Math.exp(-x) - g * t * oneMinusExpOverX;
    return {
        y: h0 + v0 * t * oneMinusExpOverX + g * t * t * positionCoeff,
        velocity,
        acceleration: -g - gamma * velocity,
    };
}

function kinematicsAt(t: number, { h0, v0, g, m, c }: FreeFallPhysics) {
    if (!(c > 0)) return vacuumAt(t, h0, v0, g);
    return dragAt(t, h0, v0, g, c / m);
}

/**
 * זמן הגעת הגוף לשיא הגובה (0 אם הוא לא נע כלפי מעלה בתחילת התנועה).
 * מאותו רגע הגובה יורד באופן מונוטוני.
 */
function apexTime({ v0, g, m, c }: FreeFallPhysics): number {
    if (v0 <= 0 || g <= 0) return 0;
    if (!(c > 0)) return v0 / g;
    const gamma = c / m;
    // log(1 + v0 γ / g) / γ → v0/g as γ → 0; log1p keeps that limit accurate.
    return Math.log1p((v0 * gamma) / g) / gamma;
}

/**
 * מוצא את רגע הפגיעה בקרקע (y = 0) בתוך [tLow, tHigh] בחיפוש בינארי,
 * כאשר y(tLow) >= 0 ו-y(tHigh) <= 0.
 */
function findImpactTime(tLow: number, tHigh: number, physics: FreeFallPhysics): number {
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
export function calculateFreeFallStep(t: number, parameters?: EngineParameters | null) {
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
