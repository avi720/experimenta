import type { ExperimentGuide } from './types';

/** Free fall with optional linear drag, matching `engines/freeFallEngine.ts` (y up, v > 0 upwards). */
export const freeFallGuide: ExperimentGuide = {
    about: {
        what: {
            he: 'גוף שנופל רק בהשפעת כוח הכובד. אפשר להוסיף התנגדות אוויר (גרר) ולראות איך היא משנה את הנפילה.',
            en: 'A body falling under gravity alone. You can add air resistance (drag) and see how it changes the fall.',
        },
        history: {
            he: 'אריסטו טען שגוף כבד נופל מהר יותר מגוף קל, וכך האמינו כמעט אלפיים שנה. בתחילת המאה ה-17 גלילאו גליליי חקר נפילה בעזרת כדורים שמתגלגלים על מישור משופע, ומצא שהמרחק גדל כמו ריבוע הזמן, בלי קשר למשקל. הסיפור שהפיל כדורים ממגדל פיזה כנראה לא קרה כפי שמספרים אותו. ב-1971 האסטרונאוט דייוויד סקוט הפיל פטיש ונוצה על הירח, ושניהם נחתו יחד.',
            en: 'Aristotle held that heavy bodies fall faster than light ones, and people believed it for almost two thousand years. In the early 1600s Galileo Galilei studied falling with balls rolling down a ramp, and found that the distance grows with the square of the time, whatever the weight. The story of him dropping balls from the Tower of Pisa probably did not happen as it is told. In 1971 astronaut David Scott dropped a hammer and a feather on the Moon, and they landed together.',
        },
        shows: {
            he: 'בלי התנגדות אוויר כל הגופים נופלים עם אותה תאוצה, g, והמהירות גדלה באופן קבוע. עם גרר הגוף מגיע למהירות סופית שבה הוא מפסיק להאיץ.',
            en: 'Without air resistance every body falls with the same acceleration, g, and its speed grows steadily. With drag the body reaches a terminal speed at which it stops speeding up.',
        },
        question: {
            he: 'האם גופים כבדים באמת נופלים מהר יותר, ואיזה חוק מתאר את הנפילה.',
            en: 'Do heavy bodies really fall faster, and what law describes the fall?',
        },
    },
    quantities: [
        { key: 'time', label: { he: 'זמן', en: 'Time' }, symbol: 't', unit: 's' },
        { key: 'position', label: { he: 'גובה', en: 'Height' }, symbol: 'y', unit: 'm' },
        { key: 'velocity', label: { he: 'מהירות', en: 'Velocity' }, symbol: 'v', unit: 'm/s' },
        // Without drag the acceleration is −g itself, so it would hand the answer over directly.
        { key: 'acceleration', label: { he: 'תאוצה', en: 'Acceleration' }, symbol: 'a', unit: 'm/s²', reveals: ['g'] },
        { key: 'energy_kinetic', label: { he: 'אנרגיה קינטית', en: 'Kinetic energy' }, symbol: 'Eₖ', unit: 'J', reveals: ['m'] },
        { key: 'energy_potential', label: { he: 'אנרגיה פוטנציאלית', en: 'Potential energy' }, symbol: 'Eₚ', unit: 'J', reveals: ['m', 'g'] },
        { key: 'energy_total', label: { he: 'אנרגיה כוללת', en: 'Total energy' }, symbol: 'E', unit: 'J', reveals: ['m', 'g'] },
    ],
    chartViews: [
        { name: { he: 'גובה ומהירות בזמן', en: 'Height and velocity vs time' }, x: 'time', y: ['position', 'velocity'] },
        { name: { he: 'אנרגיות בזמן', en: 'Energies vs time' }, x: 'time', y: ['energy_kinetic', 'energy_potential', 'energy_total'] },
        { name: { he: 'מהירות מול גובה', en: 'Velocity vs height' }, x: 'position', y: ['velocity'] },
        { name: { he: 'תאוצה מול מהירות', en: 'Acceleration vs velocity' }, x: 'velocity', y: ['acceleration'] },
    ],
    unknowns: [
        {
            key: 'g', symbol: 'g', min: 1, max: 25, step: 0.01,
            hint: {
                he: 'הגדירו מקדם גרר c = 0 ומהירות התחלתית v₀ = 0. אז הגוף יורד h₀ − y = ½gt², ולכן g = 2(h₀ − y)/t² עבור כל נקודה בגרף. דרך נוספת: השיפוע של גרף המהירות בזמן הוא −g.',
                en: 'Set the drag coefficient c = 0 and the initial velocity v₀ = 0. The body then drops h₀ − y = ½gt², so g = 2(h₀ − y)/t² at any point on the chart. Another way: the slope of the velocity–time chart is −g.',
            },
        },
        {
            key: 'c', symbol: 'c', min: 0.1, max: 2, step: 0.01,
            hint: {
                he: 'בכל רגע שבו הגוף נע, a = −g − (c/m)·v, ולכן c = −m(a + g)/v. קראו מהגרפים מהירות ותאוצה באותו רגע. אם הגוף מגיע למהירות סופית v_t, אז גם c = mg/|v_t|.',
                en: 'Whenever the body is moving, a = −g − (c/m)·v, so c = −m(a + g)/v. Read the velocity and acceleration at the same moment. If the body reaches a terminal speed v_t, then also c = mg/|v_t|.',
            },
        },
    ],
    formulas: [
        {
            title: { he: 'תנועה בלי גרר', en: 'Motion without drag' },
            formulas: [
                {
                    id: 'height', name: { he: 'גובה כתלות בזמן', en: 'Height vs time' },
                    tex: 'y(t) = h_0 + v_0 t - \\tfrac{1}{2}\\,g t^{2}', uses: ['g'],
                    description: {
                        he: 'הגובה יורד בקצב שהולך וגדל, כי הכובד מאיץ את הגוף כלפי מטה.',
                        en: 'The height drops faster and faster, because gravity speeds the body up downwards.',
                    },
                },
                {
                    id: 'velocity', name: { he: 'מהירות כתלות בזמן', en: 'Velocity vs time' },
                    tex: 'v(t) = v_0 - g\\,t', uses: ['g'],
                    description: {
                        he: 'בכל שנייה המהירות כלפי מטה גדלה ב-g. מהירות שלילית פירושה תנועה כלפי מטה.',
                        en: 'Every second the downward speed grows by g. A negative velocity means moving down.',
                    },
                },
                {
                    id: 'timeless', name: { he: 'מהירות כתלות בגובה', en: 'Velocity vs height' },
                    tex: 'v^{2} = v_0^{2} - 2g\\,(y - h_0)', uses: ['g'],
                    description: {
                        he: 'מקשרת מהירות לגובה בלי לדעת את הזמן.',
                        en: 'Links speed and height without needing the time.',
                    },
                },
                {
                    id: 'fallTime', name: { he: 'זמן נפילה (מתחילים ממנוחה)', en: 'Fall time (starting at rest)' },
                    tex: 't_{\\text{fall}} = \\sqrt{\\dfrac{2h_0}{g}}', uses: ['g'],
                    description: {
                        he: 'כמה זמן לוקח להגיע לקרקע כשמשחררים את הגוף בלי לזרוק אותו.',
                        en: 'How long it takes to reach the ground when the body is simply let go.',
                    },
                },
            ],
        },
        {
            title: { he: 'אנרגיה', en: 'Energy' },
            formulas: [
                {
                    id: 'kinetic', name: { he: 'אנרגיה קינטית', en: 'Kinetic energy' }, tex: 'E_k = \\tfrac{1}{2}\\,m v^{2}', uses: ['m'],
                    description: { he: 'אנרגיית התנועה של הגוף.', en: 'The energy of the moving body.' },
                },
                {
                    id: 'potential', name: { he: 'אנרגיה פוטנציאלית כובדית', en: 'Gravitational potential energy' }, tex: 'E_p = m g\\,y', uses: ['m', 'g'],
                    description: { he: 'האנרגיה שיש לגוף בזכות הגובה שלו מעל הקרקע.', en: 'The energy the body has because of its height above the ground.' },
                },
                {
                    id: 'conservation', name: { he: 'שימור אנרגיה (בלי גרר)', en: 'Energy conservation (no drag)' },
                    tex: 'E_k + E_p = \\tfrac{1}{2}\\,m v_0^{2} + m g\\,h_0', uses: ['m', 'g'],
                    description: {
                        he: 'בלי גרר האנרגיה הכוללת לא משתנה. גרר הופך חלק ממנה לחום, ולכן היא יורדת.',
                        en: 'Without drag the total energy does not change. Drag turns part of it into heat, so it decreases.',
                    },
                },
            ],
        },
        {
            title: { he: 'תנועה עם גרר', en: 'Motion with drag' },
            formulas: [
                {
                    id: 'drag', name: { he: 'כוח גרר (ליניארי)', en: 'Drag force (linear)' }, tex: 'F_d = -c\\,v', uses: ['c'],
                    description: {
                        he: 'האוויר דוחף נגד כיוון התנועה, וחזק יותר ככל שהגוף מהיר יותר.',
                        en: 'The air pushes against the motion, harder the faster the body moves.',
                    },
                },
                {
                    id: 'dragAcceleration', name: { he: 'תאוצה עם גרר', en: 'Acceleration with drag' },
                    tex: 'a = -g - \\dfrac{c}{m}\\,v', uses: ['g', 'c', 'm'],
                    description: {
                        he: 'החוק השני של ניוטון: הכובד והגרר יחד קובעים את התאוצה.',
                        en: "Newton's second law: gravity and drag together set the acceleration.",
                    },
                },
                {
                    id: 'terminal', name: { he: 'מהירות סופית', en: 'Terminal speed' }, tex: 'v_t = \\dfrac{m g}{c}', uses: ['m', 'g', 'c'],
                    description: {
                        he: 'המהירות שבה הגרר משתווה למשקל, והגוף מפסיק להאיץ.',
                        en: 'The speed at which drag balances the weight and the body stops speeding up.',
                    },
                },
                {
                    id: 'dragVelocity', name: { he: 'מהירות כתלות בזמן, עם גרר', en: 'Velocity vs time, with drag' },
                    tex: 'v(t) = -v_t + (v_0 + v_t)\\,e^{-\\frac{c}{m}t}', uses: ['m', 'g', 'c'],
                    description: {
                        he: 'המהירות מתקרבת בהדרגה למהירות הסופית כלפי מטה.',
                        en: 'The velocity gradually approaches the downward terminal speed.',
                    },
                },
            ],
        },
    ],
    symbols: [
        { tex: 'y', meaning: { he: 'גובה מעל הקרקע', en: 'Height above the ground' }, unit: 'm' },
        { tex: 'h_0', meaning: { he: 'גובה התחלתי', en: 'Initial height' }, unit: 'm' },
        { tex: 'v', meaning: { he: 'מהירות (חיובית כלפי מעלה)', en: 'Velocity (positive upwards)' }, unit: 'm/s' },
        { tex: 'v_0', meaning: { he: 'מהירות התחלתית', en: 'Initial velocity' }, unit: 'm/s' },
        { tex: 'a', meaning: { he: 'תאוצה', en: 'Acceleration' }, unit: 'm/s²' },
        { tex: 'g', meaning: { he: 'תאוצת הכובד', en: 'Gravitational acceleration' }, unit: 'm/s²' },
        { tex: 't', meaning: { he: 'זמן', en: 'Time' }, unit: 's' },
        { tex: 'm', meaning: { he: 'מסה', en: 'Mass' }, unit: 'kg' },
        { tex: 'c', meaning: { he: 'מקדם גרר', en: 'Drag coefficient' }, unit: 'kg/s' },
        { tex: 'v_t', meaning: { he: 'מהירות סופית', en: 'Terminal speed' }, unit: 'm/s' },
        { tex: 'E', meaning: { he: 'אנרגיה', en: 'Energy' }, unit: 'J' },
    ],
};
