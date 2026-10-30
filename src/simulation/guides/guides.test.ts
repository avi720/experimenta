import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { calculateStep as shoStep } from '../engines/shoEngine';
import { calculateFreeFallStep } from '../engines/freeFallEngine';
import { calculateQuantumTunnelingStep } from '../engines/quantumTunnelingEngine';
import { calculateInterference } from '../engines/doubleSlitEngine';
import { EXPERIMENT_GUIDES, describeSampleQuantities, hiddenQuantityKeys } from './index';

/** Parameter keys of each template (supabase/migrations), which the guides may refer to. */
const TEMPLATE_KEYS: Record<string, string[]> = {
    sho: ['m', 'k', 'x0', 'v0', 'c'],
    'free-fall': ['h0', 'v0', 'g', 'm', 'c'],
    'quantum-tunneling': ['v', 'm', 'V0', 'L'],
    'double-slit': ['source', 'wavelength', 'accelerating_voltage', 'slit_spacing', 'slit_width', 'screen_distance'],
};

/** One sample per engine, flattened the way the workspace does (Free Fall's `position.y`). */
function sampleFor(slug: string): Record<string, unknown> {
    switch (slug) {
        case 'sho':
            return shoStep(0.3, { m: 1, k: 10, x0: 1, v0: 0, c: 0 });
        case 'free-fall': {
            const s = calculateFreeFallStep(0.5, { h0: 50, v0: 0, g: 9.81, m: 1, c: 0 });
            return { ...s, position: s.position.y };
        }
        case 'quantum-tunneling':
            return calculateQuantumTunnelingStep(1, { v: 0.01, m: 5.11, V0: 1, L: 0.005 });
        case 'double-slit':
            return { ...calculateInterference({ source: 'light', wavelength: 532, slit_spacing: 250, slit_width: 50, screen_distance: 1 })[0] };
        default:
            throw new Error(slug);
    }
}

const bilingual = (value: { he?: string; en?: string }) => !!value.he?.trim() && !!value.en?.trim();

describe.each(Object.entries(EXPERIMENT_GUIDES))('guide %s', (slug, guide) => {
    if (!guide) throw new Error(slug);
    const templateKeys = TEMPLATE_KEYS[slug];

    it('renders every equation and symbol with KaTeX', () => {
        for (const group of guide.formulas) {
            for (const formula of group.formulas) {
                expect(() => katex.renderToString(formula.tex, { throwOnError: true }), formula.id).not.toThrow();
            }
        }
        for (const entry of guide.symbols) {
            expect(() => katex.renderToString(entry.tex, { throwOnError: true }), entry.tex).not.toThrow();
        }
    });

    it('has every text in Hebrew and English', () => {
        for (const group of guide.formulas) {
            expect(bilingual(group.title)).toBe(true);
            for (const f of group.formulas) {
                expect(bilingual(f.name) && bilingual(f.description), f.id).toBe(true);
            }
        }
        guide.symbols.forEach((s) => expect(bilingual(s.meaning), s.tex).toBe(true));
        guide.quantities.forEach((q) => expect(bilingual(q.label), q.key).toBe(true));
        guide.unknowns.forEach((u) => expect(bilingual(u.hint), u.key).toBe(true));
        guide.chartViews.forEach((v) => expect(bilingual(v.name)).toBe(true));
        Object.entries(guide.about).forEach(([part, text]) => expect(bilingual(text), part).toBe(true));
    });

    it('refers only to real parameters and engine outputs', () => {
        const sample = sampleFor(slug);
        for (const q of guide.quantities) {
            expect(typeof sample[q.key], `${q.key} in the ${slug} engine output`).toBe('number');
            (q.reveals || []).forEach((key) => expect(templateKeys).toContain(key));
        }
        for (const group of guide.formulas) {
            group.formulas.forEach((f) => f.uses.forEach((key) => expect(templateKeys, f.id).toContain(key)));
        }
        const quantityKeys = guide.quantities.map((q) => q.key);
        for (const view of guide.chartViews) {
            [view.x, ...view.y].forEach((key) => expect(quantityKeys).toContain(key));
        }
        for (const u of guide.unknowns) {
            expect(templateKeys).toContain(u.key);
            expect(u.min).toBeLessThan(u.max);
            expect(u.step).toBeGreaterThan(0);
        }
    });
});

describe('hidden quantities', () => {
    it('hide the energies and derived constants that give k away', () => {
        expect(hiddenQuantityKeys(EXPERIMENT_GUIDES.sho!, 'k').sort()).toEqual(
            ['angular_frequency', 'energy_potential', 'energy_total', 'period'].sort()
        );
        expect(hiddenQuantityKeys(EXPERIMENT_GUIDES.sho!, null)).toEqual([]);
    });

    it('hide the acceleration when it equals −g', () => {
        expect(hiddenQuantityKeys(EXPERIMENT_GUIDES['free-fall']!, 'g')).toContain('acceleration');
        expect(hiddenQuantityKeys(EXPERIMENT_GUIDES['free-fall']!, 'c')).not.toContain('acceleration');
    });

    it('describes raw keys when there is no guide', () => {
        expect(describeSampleQuantities(null, { time: 0, x: 1, label: 'a' }).map((q) => q.key)).toEqual(['time', 'x']);
    });
});

// The hints must lead a student to the right value: each case follows its hint on engine output.
describe('the hints recover the hidden value from the measurements', () => {
    /** Times of the local maxima of `f`, refined by a parabola through the three samples around each. */
    function peakTimes(f: (t: number) => number, tMax: number, dt: number): { t: number; value: number }[] {
        const peaks: { t: number; value: number }[] = [];
        for (let t = dt; t < tMax - dt; t += dt) {
            const [a, b, c] = [f(t - dt), f(t), f(t + dt)];
            if (b > a && b >= c) {
                const shift = (0.5 * (a - c)) / (a - 2 * b + c);
                peaks.push({ t: t + shift * dt, value: b - 0.25 * (a - c) * shift });
            }
        }
        return peaks;
    }

    it('SHO: k = 4π²m/T² from the measured period', () => {
        const params = { m: 1.3, k: 23.5, x0: 1, v0: 0.5, c: 0 };
        const peaks = peakTimes((t) => shoStep(t, params).position, 10, 0.01);
        const period = (peaks[peaks.length - 1].t - peaks[0].t) / (peaks.length - 1);
        expect((4 * Math.PI ** 2 * params.m) / period ** 2).toBeCloseTo(params.k, 2);
    });

    it('SHO: m = kT²/(4π²) from the measured period', () => {
        const params = { m: 3.7, k: 10, x0: 1, v0: 0, c: 0 };
        const peaks = peakTimes((t) => shoStep(t, params).position, 20, 0.01);
        const period = (peaks[peaks.length - 1].t - peaks[0].t) / (peaks.length - 1);
        expect((params.k * period ** 2) / (4 * Math.PI ** 2)).toBeCloseTo(params.m, 2);
    });

    it('SHO: c = 2m·ln(A₁/A₂)/Δt from two peaks', () => {
        const params = { m: 1, k: 10, x0: 1, v0: 0, c: 0.4 };
        const peaks = peakTimes((t) => shoStep(t, params).position, 10, 0.005);
        const [first, later] = [peaks[0], peaks[3]];
        const gamma = Math.log(first.value / later.value) / (later.t - first.t);
        expect(2 * params.m * gamma).toBeCloseTo(params.c, 3);
    });

    it('Free fall: g = 2(h₀ − y)/t² with no drag, starting at rest', () => {
        const params = { h0: 50, v0: 0, g: 3.71, m: 1, c: 0 };
        const t = 2.4;
        const y = calculateFreeFallStep(t, params).position.y;
        expect((2 * (params.h0 - y)) / t ** 2).toBeCloseTo(params.g, 9);
    });

    it('Free fall: c = −m(a + g)/v from one moment of the motion', () => {
        const params = { h0: 200, v0: 0, g: 9.81, m: 2, c: 0.7 };
        const { velocity, acceleration } = calculateFreeFallStep(1.5, params);
        expect((-params.m * (acceleration + params.g)) / velocity).toBeCloseTo(params.c, 9);
    });

    describe('Double slit, from the fringe spacing Δy = λD/d', () => {
        const params = { source: 'light', wavelength: 560, slit_spacing: 250, slit_width: 50, screen_distance: 1.2 };
        const pattern = calculateInterference(params);
        // Average the spacing over the fringes on both sides of the centre, as the hint suggests.
        const peaks = pattern
            .map((p, i) => ({ ...p, i }))
            .filter(({ i }) => i > 0 && i < pattern.length - 1)
            .filter(({ i }) => pattern[i].intensity > pattern[i - 1].intensity && pattern[i].intensity >= pattern[i + 1].intensity)
            .filter((p) => p.intensity > 0.3)
            .map(({ i }) => {
                const [a, b, c] = [pattern[i - 1], pattern[i], pattern[i + 1]];
                const shift = (0.5 * (a.intensity - c.intensity)) / (a.intensity - 2 * b.intensity + c.intensity);
                return b.position + shift * (c.position - b.position);
            });
        const spacingMm = (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1);

        it('λ = Δy·d/D lands within the 5% a "good" answer allows', () => {
            const lambdaNm = (spacingMm * 1e-3 * params.slit_spacing * 1e-6 / params.screen_distance) * 1e9;
            expect(Math.abs(lambdaNm - params.wavelength) / params.wavelength).toBeLessThan(0.02);
        });

        it('d = λD/Δy lands within the 5% a "good" answer allows', () => {
            const spacingUm = (params.wavelength * 1e-9 * params.screen_distance / (spacingMm * 1e-3)) * 1e6;
            expect(Math.abs(spacingUm - params.slit_spacing) / params.slit_spacing).toBeLessThan(0.02);
        });
    });
});
