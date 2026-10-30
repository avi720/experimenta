import type { ExperimentGuide } from './types';

/** Two-slit interference with a single-slit envelope, matching `engines/doubleSlitEngine.ts`. */
export const doubleSlitGuide: ExperimentGuide = {
    quantities: [
        { key: 'position', label: { he: 'מיקום על המסך', en: 'Position on the screen' }, symbol: 'y', unit: 'mm' },
        { key: 'intensity', label: { he: 'עוצמה יחסית', en: 'Relative intensity' }, symbol: 'I', unit: '' },
    ],
    chartViews: [
        { name: { he: 'עוצמה על המסך', en: 'Intensity on the screen' }, x: 'position', y: ['intensity'] },
    ],
    unknowns: [
        {
            key: 'wavelength', symbol: 'λ', min: 400, max: 700, step: 1,
            hint: {
                he: 'מדדו בגרף את המרחק Δy בין שני פסים בהירים סמוכים ליד המרכז (מדויק יותר: מדדו על פני כמה פסים וחלקו במספרם). אז λ = Δy·d/D. שימו לב ליחידות: Δy במילימטרים, d במיקרומטרים ו-D במטרים.',
                en: 'On the chart, measure the distance Δy between two neighbouring bright fringes near the centre (more accurate: measure across several fringes and divide). Then λ = Δy·d/D. Mind the units: Δy in millimetres, d in micrometres and D in metres.',
            },
        },
        {
            key: 'slit_spacing', symbol: 'd', min: 100, max: 800, step: 10,
            hint: {
                he: 'מדדו את המרחק Δy בין שני פסים בהירים סמוכים ליד המרכז. מ-Δy = λD/d מקבלים d = λD/Δy.',
                en: 'Measure the distance Δy between two neighbouring bright fringes near the centre. From Δy = λD/d you get d = λD/Δy.',
            },
        },
    ],
    formulas: [
        {
            title: { he: 'מיקום הפסים', en: 'Where the fringes fall' },
            formulas: [
                {
                    id: 'brightFringes', name: { he: 'פסים בהירים', en: 'Bright fringes' },
                    tex: 'd\\,\\sin\\theta = n\\,\\lambda,\\quad n = 0, \\pm1, \\pm2, \\dots', uses: ['slit_spacing', 'wavelength'],
                    description: {
                        he: 'פס בהיר מופיע היכן שהגלים משני הסדקים מגיעים באותו מופע: הפרש הדרכים שלהם הוא מספר שלם של אורכי גל.',
                        en: 'A bright fringe appears where the waves from the two slits arrive in step: their path difference is a whole number of wavelengths.',
                    },
                },
                {
                    id: 'fringeSpacing', name: { he: 'מרחק בין פסים (זוויות קטנות)', en: 'Fringe spacing (small angles)' },
                    tex: '\\Delta y = \\dfrac{\\lambda D}{d}', uses: ['wavelength', 'screen_distance', 'slit_spacing'],
                    description: {
                        he: 'אורך גל ארוך או מסך רחוק מרחיקים את הפסים. סדקים רחוקים זה מזה מקרבים אותם.',
                        en: 'A longer wavelength or a farther screen spreads the fringes. Slits further apart bring them closer.',
                    },
                },
                {
                    id: 'angle', name: { he: 'זווית מהמסך', en: 'Angle from the screen' },
                    tex: '\\sin\\theta = \\dfrac{y}{\\sqrt{y^{2} + D^{2}}}', uses: ['screen_distance'],
                    description: {
                        he: 'ממירה מיקום על המסך לזווית שבה הגל יוצא מהסדקים.',
                        en: 'Turns a position on the screen into the angle at which the wave leaves the slits.',
                    },
                },
            ],
        },
        {
            title: { he: 'העוצמה', en: 'The intensity' },
            formulas: [
                {
                    id: 'envelopeZero', name: { he: 'האפס הראשון של מעטפת הסדק הבודד', en: 'First zero of the single-slit envelope' },
                    tex: 'a\\,\\sin\\theta = \\lambda \\;\\Rightarrow\\; y_1 \\approx \\dfrac{\\lambda D}{a}', uses: ['slit_width', 'wavelength', 'screen_distance'],
                    description: {
                        he: 'כל סדק לבדו מפזר את הגל. הפסים חיים בתוך המעטפת הזו, ומחוץ לה הם חלשים מאוד.',
                        en: 'Each slit on its own spreads the wave. The fringes live inside this envelope and are very faint outside it.',
                    },
                },
                {
                    id: 'intensity', name: { he: 'עוצמה על המסך', en: 'Intensity on the screen' },
                    tex: 'I(\\theta) = I_0 \\cos^{2}\\!\\left(\\dfrac{\\pi d \\sin\\theta}{\\lambda}\\right) \\left[\\dfrac{\\sin\\beta}{\\beta}\\right]^{2},\\quad \\beta = \\dfrac{\\pi a \\sin\\theta}{\\lambda}', uses: ['slit_spacing', 'slit_width', 'wavelength'],
                    description: {
                        he: 'הגורם הראשון יוצר את הפסים (התאבכות), השני את המעטפת (עקיפה).',
                        en: 'The first factor makes the fringes (interference), the second the envelope (diffraction).',
                    },
                },
            ],
        },
        {
            title: { he: 'אלקטרונים', en: 'Electrons' },
            formulas: [
                {
                    id: 'deBroglie', name: { he: 'אורך הגל של דה־ברויי', en: 'De Broglie wavelength' },
                    tex: '\\lambda = \\dfrac{h}{p},\\quad p = \\sqrt{2 m_e e U \\left(1 + \\dfrac{eU}{2 m_e c^{2}}\\right)}', uses: ['accelerating_voltage'],
                    description: {
                        he: 'לחלקיק עם תנע p יש אורך גל. מתח האצה גבוה נותן תנע גדול ואורך גל קצר. הסוגריים הם תיקון יחסותי, חשוב במתחים של עשרות קילו־וולט.',
                        en: 'A particle with momentum p has a wavelength. A high accelerating voltage gives a large momentum and a short wavelength. The bracket is a relativistic correction that matters at tens of kilovolts.',
                    },
                },
            ],
        },
    ],
    symbols: [
        { tex: '\\lambda', meaning: { he: 'אורך גל', en: 'Wavelength' }, unit: 'nm' },
        { tex: 'd', meaning: { he: 'מרחק בין מרכזי הסדקים', en: 'Slit spacing, centre to centre' }, unit: 'µm' },
        { tex: 'a', meaning: { he: 'רוחב כל סדק', en: 'Width of each slit' }, unit: 'µm' },
        { tex: 'D', meaning: { he: 'מרחק מהסדקים למסך', en: 'Distance from slits to screen' }, unit: 'm' },
        { tex: 'y', meaning: { he: 'מיקום על המסך, ממרכזו', en: 'Position on the screen, from its centre' }, unit: 'mm' },
        { tex: '\\Delta y', meaning: { he: 'מרחק בין פסים בהירים סמוכים', en: 'Distance between neighbouring bright fringes' }, unit: 'mm' },
        { tex: '\\theta', meaning: { he: 'זווית מהציר המרכזי', en: 'Angle from the centre line' }, unit: 'rad' },
        { tex: 'I', meaning: { he: 'עוצמה, יחסית לשיא', en: 'Intensity, relative to the peak' }, unit: '' },
        { tex: 'U', meaning: { he: 'מתח האצה', en: 'Accelerating voltage' }, unit: 'kV' },
        { tex: 'h', meaning: { he: 'קבוע פלאנק, 6.626·10⁻³⁴', en: 'Planck constant, 6.626·10⁻³⁴' }, unit: 'J·s' },
        { tex: 'm_e,\\ e', meaning: { he: 'מסת האלקטרון ומטענו', en: 'Electron mass and charge' }, unit: 'kg, C' },
    ],
};
