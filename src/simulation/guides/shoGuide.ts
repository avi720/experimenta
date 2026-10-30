import type { ExperimentGuide } from './types';

/** Simple harmonic oscillator (mass on a spring), matching `engines/shoEngine.ts`. */
export const shoGuide: ExperimentGuide = {
    quantities: [
        { key: 'time', label: { he: 'זמן', en: 'Time' }, symbol: 't', unit: 's' },
        { key: 'position', label: { he: 'מיקום', en: 'Position' }, symbol: 'x', unit: 'm' },
        { key: 'velocity', label: { he: 'מהירות', en: 'Velocity' }, symbol: 'v', unit: 'm/s' },
        { key: 'acceleration', label: { he: 'תאוצה', en: 'Acceleration' }, symbol: 'a', unit: 'm/s²' },
        { key: 'energy_kinetic', label: { he: 'אנרגיה קינטית', en: 'Kinetic energy' }, symbol: 'Eₖ', unit: 'J', reveals: ['m'] },
        { key: 'energy_potential', label: { he: 'אנרגיה פוטנציאלית', en: 'Potential energy' }, symbol: 'Eₚ', unit: 'J', reveals: ['k'] },
        { key: 'energy_total', label: { he: 'אנרגיה כוללת', en: 'Total energy' }, symbol: 'E', unit: 'J', reveals: ['m', 'k'] },
        { key: 'angular_frequency', label: { he: 'תדירות זוויתית טבעית', en: 'Natural angular frequency' }, symbol: 'ω₀', unit: 'rad/s', reveals: ['m', 'k'], chartable: false },
        { key: 'period', label: { he: 'זמן מחזור', en: 'Period' }, symbol: 'T', unit: 's', reveals: ['m', 'k'], chartable: false },
    ],
    chartViews: [
        { name: { he: 'מיקום ומהירות בזמן', en: 'Position and velocity vs time' }, x: 'time', y: ['position', 'velocity'] },
        { name: { he: 'מרחב פאזה', en: 'Phase space' }, x: 'position', y: ['velocity'] },
        { name: { he: 'אנרגיות בזמן', en: 'Energies vs time' }, x: 'time', y: ['energy_kinetic', 'energy_potential', 'energy_total'] },
        { name: { he: 'תאוצה מול מיקום', en: 'Acceleration vs position' }, x: 'position', y: ['acceleration'] },
    ],
    unknowns: [
        {
            key: 'k', symbol: 'k', min: 2, max: 60, step: 0.5,
            hint: {
                he: 'מדדו בגרף מיקום–זמן את זמן המחזור T: הזמן בין שני שיאים סמוכים (מדויק יותר: מדדו כמה מחזורים וחלקו במספרם). בלי ריסון ω₀ = 2π/T, ולכן k = m·ω₀² = 4π²m/T². דרך נוספת: בגרף תאוצה מול מיקום השיפוע הוא −k/m.',
                en: 'On the position–time chart, measure the period T: the time between two neighbouring peaks (more accurate: time several periods and divide). Without damping ω₀ = 2π/T, so k = m·ω₀² = 4π²m/T². Another way: on the acceleration–position chart the slope is −k/m.',
            },
        },
        {
            key: 'm', symbol: 'm', min: 0.5, max: 5, step: 0.1,
            hint: {
                he: 'מדדו את זמן המחזור T מהגרף. מ-T = 2π√(m/k) מקבלים m = kT²/(4π²). דרך נוספת: בגרף תאוצה מול מיקום השיפוע הוא −k/m.',
                en: 'Measure the period T on the chart. From T = 2π√(m/k) you get m = kT²/(4π²). Another way: on the acceleration–position chart the slope is −k/m.',
            },
        },
        {
            key: 'c', symbol: 'c', min: 0.1, max: 1.5, step: 0.05,
            hint: {
                he: 'מדדו שני שיאים של המיקום, A₁ ו-A₂, שביניהם עבר זמן Δt. המעטפת דועכת כמו e^(−γt), לכן γ = ln(A₁/A₂)/Δt, ומ-γ = c/(2m) מקבלים c = 2mγ.',
                en: 'Read two position peaks, A₁ and A₂, a time Δt apart. The envelope decays as e^(−γt), so γ = ln(A₁/A₂)/Δt, and from γ = c/(2m) you get c = 2mγ.',
            },
        },
    ],
    formulas: [
        {
            title: { he: 'כוח ותנועה', en: 'Force and motion' },
            formulas: [
                {
                    id: 'hooke', name: { he: 'חוק הוק', en: "Hooke's law" }, tex: 'F = -kx', uses: ['k'],
                    description: {
                        he: 'הקפיץ מושך את המסה חזרה לנקודת שיווי המשקל. ככל שמותחים אותו יותר, הכוח גדול יותר.',
                        en: 'The spring pulls the mass back towards equilibrium. The more it is stretched, the stronger the pull.',
                    },
                },
                {
                    id: 'newton', name: { he: 'החוק השני של ניוטון, עם ריסון', en: "Newton's second law, with damping" },
                    tex: 'm\\,a = -kx - c\\,v', uses: ['m', 'k', 'c'],
                    description: {
                        he: 'הכוח הכולל הוא כוח הקפיץ ועוד כוח ריסון (חיכוך) שמנוגד למהירות.',
                        en: 'The total force is the spring force plus a damping (friction) force opposite to the velocity.',
                    },
                },
            ],
        },
        {
            title: { he: 'תדירות וזמן מחזור', en: 'Frequency and period' },
            formulas: [
                {
                    id: 'omega0', name: { he: 'תדירות זוויתית טבעית', en: 'Natural angular frequency' },
                    tex: '\\omega_0 = \\sqrt{\\dfrac{k}{m}}', uses: ['k', 'm'],
                    description: {
                        he: 'כמה מהר המסה מתנודדת. קפיץ קשיח מגדיל אותה, מסה כבדה מקטינה אותה.',
                        en: 'How fast the mass oscillates. A stiffer spring raises it, a heavier mass lowers it.',
                    },
                },
                {
                    id: 'period', name: { he: 'זמן מחזור', en: 'Period' },
                    tex: 'T = \\dfrac{2\\pi}{\\omega_0} = 2\\pi\\sqrt{\\dfrac{m}{k}}', uses: ['k', 'm'],
                    description: {
                        he: 'הזמן של תנודה שלמה אחת: מהשיא, הלאה וחזרה לאותו שיא.',
                        en: 'The time of one full oscillation: from a peak, out and back to the same peak.',
                    },
                },
                {
                    id: 'frequency', name: { he: 'תדירות', en: 'Frequency' }, tex: 'f = \\dfrac{1}{T}', uses: [],
                    description: {
                        he: 'מספר התנודות בשנייה, ביחידות הרץ (Hz).',
                        en: 'The number of oscillations per second, in hertz (Hz).',
                    },
                },
            ],
        },
        {
            title: { he: 'מיקום, מהירות ותאוצה (בלי ריסון)', en: 'Position, velocity and acceleration (no damping)' },
            formulas: [
                {
                    id: 'position', name: { he: 'מיקום', en: 'Position' },
                    tex: 'x(t) = A\\cos(\\omega_0 t + \\varphi)', uses: ['k', 'm'],
                    description: {
                        he: 'המיקום משתנה כמו גל קוסינוס סביב נקודת שיווי המשקל.',
                        en: 'The position swings like a cosine wave around equilibrium.',
                    },
                },
                {
                    id: 'velocity', name: { he: 'מהירות', en: 'Velocity' },
                    tex: 'v(t) = -A\\omega_0\\sin(\\omega_0 t + \\varphi)', uses: ['k', 'm'],
                    description: {
                        he: 'המהירות מרבית במעבר דרך שיווי המשקל ואפס בקצוות.',
                        en: 'The speed is largest when passing equilibrium and zero at the turning points.',
                    },
                },
                {
                    id: 'acceleration', name: { he: 'תאוצה', en: 'Acceleration' },
                    tex: 'a = -\\omega_0^{2}\\,x = -\\dfrac{k}{m}\\,x', uses: ['k', 'm'],
                    description: {
                        he: 'התאוצה תמיד מכוונת לשיווי המשקל ופרופורציונית להתרחקות ממנו.',
                        en: 'The acceleration always points to equilibrium and grows with the distance from it.',
                    },
                },
                {
                    id: 'amplitude', name: { he: 'משרעת (אמפליטודה)', en: 'Amplitude' },
                    tex: 'A = \\sqrt{x_0^{2} + \\left(\\dfrac{v_0}{\\omega_0}\\right)^{2}}', uses: ['k', 'm'],
                    description: {
                        he: 'ההתרחקות המרבית משיווי המשקל, לפי תנאי ההתחלה.',
                        en: 'The largest distance from equilibrium, set by the starting conditions.',
                    },
                },
            ],
        },
        {
            title: { he: 'אנרגיה', en: 'Energy' },
            formulas: [
                {
                    id: 'kinetic', name: { he: 'אנרגיה קינטית', en: 'Kinetic energy' }, tex: 'E_k = \\tfrac{1}{2}\\,m v^{2}', uses: ['m'],
                    description: { he: 'אנרגיית התנועה של המסה.', en: 'The energy of the moving mass.' },
                },
                {
                    id: 'potential', name: { he: 'אנרגיה פוטנציאלית אלסטית', en: 'Elastic potential energy' }, tex: 'E_p = \\tfrac{1}{2}\\,k x^{2}', uses: ['k'],
                    description: { he: 'האנרגיה שאגורה בקפיץ המתוח או המכווץ.', en: 'The energy stored in the stretched or compressed spring.' },
                },
                {
                    id: 'conservation', name: { he: 'שימור אנרגיה (בלי ריסון)', en: 'Energy conservation (no damping)' },
                    tex: 'E = E_k + E_p = \\tfrac{1}{2}\\,k A^{2}', uses: ['k'],
                    description: {
                        he: 'בלי ריסון האנרגיה הכוללת קבועה. היא רק עוברת בין קינטית לפוטנציאלית.',
                        en: 'Without damping the total energy stays constant; it only moves between kinetic and potential.',
                    },
                },
            ],
        },
        {
            title: { he: 'תנודה מרוסנת', en: 'Damped oscillation' },
            formulas: [
                {
                    id: 'gamma', name: { he: 'קצב דעיכה', en: 'Decay rate' }, tex: '\\gamma = \\dfrac{c}{2m}', uses: ['c', 'm'],
                    description: { he: 'כמה מהר התנודה נחלשת.', en: 'How quickly the oscillation fades.' },
                },
                {
                    id: 'omegaD', name: { he: 'תדירות מרוסנת', en: 'Damped frequency' },
                    tex: '\\omega_d = \\sqrt{\\omega_0^{2} - \\gamma^{2}}', uses: ['k', 'm', 'c'],
                    description: {
                        he: 'הריסון מאט מעט את התנודה. זו התדירות שנמדדת בגרף כשיש ריסון.',
                        en: 'Damping slows the oscillation slightly. This is the frequency you measure on the chart when there is damping.',
                    },
                },
                {
                    id: 'dampedPosition', name: { he: 'מיקום בתנודה מרוסנת', en: 'Damped position' },
                    tex: 'x(t) = A\\,e^{-\\gamma t}\\cos(\\omega_d t + \\varphi)', uses: ['k', 'm', 'c'],
                    description: {
                        he: 'השיאים קטנים בהדרגה לפי המעטפת A·e^(−γt). אם γ ≥ ω₀ אין תנודה: המסה חוזרת לאט לשיווי המשקל.',
                        en: 'The peaks shrink along the envelope A·e^(−γt). If γ ≥ ω₀ there is no oscillation: the mass creeps back to equilibrium.',
                    },
                },
            ],
        },
    ],
    symbols: [
        { tex: 'x', meaning: { he: 'מיקום (התרחקות משיווי המשקל)', en: 'Position (distance from equilibrium)' }, unit: 'm' },
        { tex: 'v', meaning: { he: 'מהירות', en: 'Velocity' }, unit: 'm/s' },
        { tex: 'a', meaning: { he: 'תאוצה', en: 'Acceleration' }, unit: 'm/s²' },
        { tex: 't', meaning: { he: 'זמן', en: 'Time' }, unit: 's' },
        { tex: 'm', meaning: { he: 'מסה', en: 'Mass' }, unit: 'kg' },
        { tex: 'k', meaning: { he: 'קבוע הקפיץ (קשיחות)', en: 'Spring constant (stiffness)' }, unit: 'N/m' },
        { tex: 'c', meaning: { he: 'מקדם ריסון', en: 'Damping coefficient' }, unit: 'kg/s' },
        { tex: 'F', meaning: { he: 'כוח', en: 'Force' }, unit: 'N' },
        { tex: 'A', meaning: { he: 'משרעת', en: 'Amplitude' }, unit: 'm' },
        { tex: '\\varphi', meaning: { he: 'מופע התחלתי', en: 'Initial phase' }, unit: 'rad' },
        { tex: 'x_0,\\ v_0', meaning: { he: 'מיקום ומהירות בתחילת התנועה', en: 'Starting position and velocity' }, unit: 'm, m/s' },
        { tex: '\\omega_0', meaning: { he: 'תדירות זוויתית טבעית', en: 'Natural angular frequency' }, unit: 'rad/s' },
        { tex: '\\gamma', meaning: { he: 'קצב דעיכה', en: 'Decay rate' }, unit: '1/s' },
        { tex: 'T', meaning: { he: 'זמן מחזור', en: 'Period' }, unit: 's' },
        { tex: 'f', meaning: { he: 'תדירות', en: 'Frequency' }, unit: 'Hz' },
        { tex: 'E', meaning: { he: 'אנרגיה', en: 'Energy' }, unit: 'J' },
    ],
};
