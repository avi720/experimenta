import type { ExperimentGuide } from './types';

/**
 * Rectangular-barrier tunneling, matching `engines/quantumTunnelingEngine.ts`. No parameter is
 * offered as an unknown: recovering V₀ or L from T means inverting a sinh/sin formula, which is
 * not a measurement a student can make from these charts.
 */
export const quantumTunnelingGuide: ExperimentGuide = {
    about: {
        what: {
            he: 'חלקיק קוונטי, כמו אלקטרון, פוגש מחסום אנרגיה שלפי הפיזיקה הקלאסית אין לו מספיק אנרגיה לעבור. בכל זאת יש לו סיכוי לעבור דרכו. התופעה נקראת מנהור קוונטי.',
            en: 'A quantum particle, such as an electron, meets an energy barrier it does not have enough energy to cross by classical physics. Still, it has a chance of getting through. This is called quantum tunneling.',
        },
        history: {
            he: 'פרידריך הונד תיאר את התופעה ב-1927. ב-1928 ג׳ורג׳ גאמוב, ובאופן בלתי תלוי רונלד גרני ואדוארד קונדון, השתמשו בה כדי להסביר דעיכת אלפא: איך חלקיק אלפא בורח מגרעין האטום למרות המחסום שמחזיק אותו. מאוחר יותר המנהור הוביל לדיודת המנהור של לאו אסאקי (1957) ולמיקרוסקופ המנהור הסורק של בינינג ורוהרר (1981), ששניהם זכו בפרס נובל.',
            en: 'Friedrich Hund described the effect in 1927. In 1928 George Gamow, and independently Ronald Gurney and Edward Condon, used it to explain alpha decay: how an alpha particle escapes an atomic nucleus despite the barrier holding it in. Tunneling later led to Leo Esaki’s tunnel diode (1957) and Binnig and Rohrer’s scanning tunneling microscope (1981), both of which won Nobel Prizes.',
        },
        shows: {
            he: 'לחלקיקים יש גם התנהגות של גל. הגל דועך בתוך המחסום אבל לא נעלם, ולכן יש סיכוי לעבור. הסיכוי יורד מהר מאוד כשהמחסום רחב או גבוה יותר.',
            en: 'Particles also behave like waves. The wave fades inside the barrier but does not vanish, so there is a chance of getting through. That chance drops very fast as the barrier gets wider or higher.',
        },
        question: {
            he: 'איך ייתכן שגרעינים רדיואקטיביים פולטים חלקיקי אלפא, כשלפי הפיזיקה הקלאסית לחלקיקים אין מספיק אנרגיה לצאת.',
            en: 'How can radioactive nuclei emit alpha particles, when by classical physics the particles do not have enough energy to get out?',
        },
    },
    quantities: [
        { key: 'time', label: { he: 'זמן הדמיה', en: 'Animation time' }, symbol: 't', unit: 's' },
        { key: 'position', label: { he: 'מיקום בהדמיה', en: 'Position in the animation' }, symbol: 'x', unit: '' },
        { key: 'phase', label: { he: 'מופע הגל', en: 'Wave phase' }, symbol: 'φ', unit: 'rad' },
        { key: 'transmission', label: { he: 'מקדם מעבר', en: 'Transmission coefficient' }, symbol: 'T', unit: '' },
        { key: 'reflection', label: { he: 'מקדם החזרה', en: 'Reflection coefficient' }, symbol: 'R', unit: '' },
    ],
    chartViews: [
        { name: { he: 'מעבר והחזרה', en: 'Transmission and reflection' }, x: 'time', y: ['transmission', 'reflection'] },
        { name: { he: 'מיקום בזמן', en: 'Position vs time' }, x: 'time', y: ['position'] },
    ],
    unknowns: [],
    formulas: [
        {
            title: { he: 'האנרגיה של החלקיק', en: 'The particle’s energy' },
            formulas: [
                {
                    id: 'energy', name: { he: 'אנרגיה קינטית', en: 'Kinetic energy' }, tex: 'E = \\tfrac{1}{2}\\,m v^{2}', uses: ['m', 'v'],
                    description: {
                        he: 'החלקיק איטי בהרבה ממהירות האור, ולכן הנוסחה הקלאסית מספיקה.',
                        en: 'The particle is far slower than light, so the classical formula is enough.',
                    },
                },
                {
                    id: 'kappa', name: { he: 'קצב הדעיכה בתוך המחסום', en: 'Decay constant inside the barrier' },
                    tex: '\\kappa = \\dfrac{\\sqrt{2m\\,(V_0 - E)}}{\\hbar}', uses: ['m', 'V0', 'v'],
                    description: {
                        he: 'כש-E < V₀, גל ההסתברות דועך בתוך המחסום. ככל ש-κ גדול יותר, הוא דועך מהר יותר.',
                        en: 'When E < V₀ the probability wave decays inside the barrier. The larger κ, the faster it fades.',
                    },
                },
            ],
        },
        {
            title: { he: 'הסתברות לעבור', en: 'Probability of getting through' },
            formulas: [
                {
                    id: 'tunneling', name: { he: 'מקדם מעבר כש-E < V₀ (מנהור)', en: 'Transmission when E < V₀ (tunneling)' },
                    tex: 'T = \\left[1 + \\dfrac{V_0^{2}\\,\\sinh^{2}(\\kappa L)}{4E\\,(V_0 - E)}\\right]^{-1}', uses: ['V0', 'L', 'm', 'v'],
                    description: {
                        he: 'בפיזיקה קלאסית החלקיק היה נעצר. בקוונטים יש לו סיכוי לעבור, והוא קטן מאוד כשהמחסום רחב או גבוה.',
                        en: 'Classically the particle would bounce back. Quantum mechanically it can get through, with a chance that shrinks fast for a wide or high barrier.',
                    },
                },
                {
                    id: 'thickBarrier', name: { he: 'קירוב למחסום עבה', en: 'Thick-barrier approximation' },
                    tex: 'T \\approx 16\\,\\dfrac{E}{V_0}\\left(1 - \\dfrac{E}{V_0}\\right) e^{-2\\kappa L}', uses: ['V0', 'L', 'm', 'v'],
                    description: {
                        he: 'כש-κL גדול בהרבה מ-1, הסיכוי לעבור יורד בערך אקספוננציאלית עם רוחב המחסום.',
                        en: 'When κL is much larger than 1, the chance of getting through falls roughly exponentially with the barrier width.',
                    },
                },
                {
                    id: 'overBarrier', name: { he: 'מקדם מעבר כש-E > V₀', en: 'Transmission when E > V₀' },
                    tex: 'T = \\left[1 + \\dfrac{V_0^{2}\\,\\sin^{2}(k_2 L)}{4E\\,(E - V_0)}\\right]^{-1},\\quad k_2 = \\dfrac{\\sqrt{2m\\,(E - V_0)}}{\\hbar}', uses: ['V0', 'L', 'm', 'v'],
                    description: {
                        he: 'גם כשיש לחלקיק מספיק אנרגיה, חלק מהגל מוחזר. כש-k₂L הוא כפולה של π, המעבר מלא (T = 1).',
                        en: 'Even with enough energy, part of the wave is reflected. When k₂L is a multiple of π, it passes completely (T = 1).',
                    },
                },
                {
                    id: 'sum', name: { he: 'שימור הסתברות', en: 'Probability is conserved' }, tex: 'R = 1 - T', uses: [],
                    description: {
                        he: 'החלקיק בסוף עובר או מוחזר, לכן שתי ההסתברויות מסתכמות ל-1.',
                        en: 'The particle ends up either through or bounced back, so the two probabilities add up to 1.',
                    },
                },
            ],
        },
    ],
    symbols: [
        { tex: 'E', meaning: { he: 'אנרגיה קינטית של החלקיק', en: 'Particle’s kinetic energy' }, unit: 'eV' },
        { tex: 'V_0', meaning: { he: 'גובה המחסום', en: 'Barrier height' }, unit: 'eV' },
        { tex: 'L', meaning: { he: 'רוחב המחסום', en: 'Barrier width' }, unit: 'µm' },
        { tex: 'm', meaning: { he: 'מסת החלקיק (מסת האלקטרון ≈ 5.11)', en: 'Particle mass (electron ≈ 5.11)' }, unit: '10⁵ eV/c²' },
        { tex: 'v', meaning: { he: 'מהירות החלקיק, כחלק ממהירות האור', en: 'Particle speed, as a fraction of light speed' }, unit: 'c' },
        { tex: '\\hbar', meaning: { he: 'קבוע פלאנק המצומצם, 1.055·10⁻³⁴', en: 'Reduced Planck constant, 1.055·10⁻³⁴' }, unit: 'J·s' },
        { tex: '\\kappa', meaning: { he: 'קצב הדעיכה בתוך המחסום', en: 'Decay constant inside the barrier' }, unit: '1/m' },
        { tex: 'T,\\ R', meaning: { he: 'הסתברות מעבר והסתברות החזרה', en: 'Transmission and reflection probabilities' }, unit: '' },
    ],
};
