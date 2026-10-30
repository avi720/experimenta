import { describe, expect, it } from 'vitest';
import { EXPERIMENT_GUIDES } from '@/simulation/guides';
import { chartableQuantities, defaultAxes, formatTick, groupByUnit, sanitizeAxes } from './chartAxes';

const sho = EXPERIMENT_GUIDES.sho!;
const shoSample = { time: 0, position: 1, velocity: 0, acceleration: -10, energy_kinetic: 0, energy_potential: 5, energy_total: 5, angular_frequency: 3.16, period: 1.99 };

describe('chart axes', () => {
    it('offers the chartable quantities only (no flat per-run constants)', () => {
        const keys = chartableQuantities(sho, shoSample).map((q) => q.key);
        expect(keys).toContain('velocity');
        expect(keys).not.toContain('period');
        expect(keys).not.toContain('angular_frequency');
    });

    it('starts with time on X and the template outputs on Y', () => {
        const quantities = chartableQuantities(sho, shoSample);
        expect(defaultAxes(quantities, ['position', 'velocity', 'energy_total'], sho)).toEqual({
            x: 'time',
            y: ['position', 'velocity', 'energy_total'],
        });
    });

    it('uses the first view when there is no time axis (double slit)', () => {
        const guide = EXPERIMENT_GUIDES['double-slit']!;
        const quantities = chartableQuantities(guide, { position: -3, intensity: 0.1 });
        expect(defaultAxes(quantities, ['intensity'], guide)).toEqual({ x: 'position', y: ['intensity'] });
    });

    it('never plots a hidden quantity or repeats X on Y', () => {
        const quantities = chartableQuantities(sho, shoSample);
        const fallback = { x: 'time', y: ['position'] };
        expect(sanitizeAxes({ x: 'time', y: ['position', 'energy_potential'] }, quantities, ['energy_potential'], fallback))
            .toEqual({ x: 'time', y: ['position'] });
        expect(sanitizeAxes({ x: 'energy_total', y: ['velocity'] }, quantities, ['energy_total'], fallback))
            .toEqual({ x: 'time', y: ['velocity'] });
        expect(sanitizeAxes({ x: 'velocity', y: ['velocity'] }, quantities, [], fallback))
            .toEqual({ x: 'velocity', y: ['position'] });
    });

    it('gives each unit its own chart', () => {
        const quantities = chartableQuantities(sho, shoSample);
        const groups = groupByUnit(['position', 'energy_kinetic', 'velocity', 'energy_total'], quantities);
        expect(groups.map((g) => [g.unit, g.quantities.map((q) => q.key)])).toEqual([
            ['m', ['position']],
            ['J', ['energy_kinetic', 'energy_total']],
            ['m/s', ['velocity']],
        ]);
    });

    it('formats ticks to three significant figures', () => {
        expect(formatTick(0.123456)).toBe('0.123');
        expect(formatTick(12345)).toBe('12300');
        expect(formatTick(0)).toBe('0');
        expect(formatTick(2.5e-5)).toBe('2.5e-5');
    });
});
