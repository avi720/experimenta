import { describe, expect, it } from 'vitest';
import {
    drawUnknownValue,
    guessErrorPercent,
    omitKeys,
    parseRunChallenge,
    rateGuess,
    toRunChallenge,
    type ChallengeState,
} from './challenge';

describe('drawUnknownValue', () => {
    it('stays on the step grid inside the range', () => {
        const spec = { min: 2, max: 60, step: 0.5 };
        for (const r of [0, 0.123, 0.5, 0.999999]) {
            const value = drawUnknownValue(spec, {}, () => r);
            expect(value).toBeGreaterThanOrEqual(2);
            expect(value).toBeLessThanOrEqual(60);
            expect(Number.isInteger((value - 2) / 0.5)).toBe(true);
        }
        expect(drawUnknownValue(spec, {}, () => 0)).toBe(2);
        expect(drawUnknownValue(spec, {}, () => 0.999999)).toBe(60);
    });

    it('rounds away floating-point noise from fractional steps', () => {
        const value = drawUnknownValue({ min: 0.1, max: 1.5, step: 0.05 }, {}, () => 0.5);
        expect(String(value).length).toBeLessThanOrEqual(4);
    });

    it("clamps to the template's own limits", () => {
        const value = drawUnknownValue({ min: 1, max: 25, step: 0.01 }, { min: 5, max: 6 }, () => 0.999999);
        expect(value).toBe(6);
        expect(drawUnknownValue({ min: 1, max: 25, step: 0.01 }, { min: 5, max: 6 }, () => 0)).toBe(5);
    });
});

describe('guess scoring', () => {
    it('measures the relative error in percent', () => {
        expect(guessErrorPercent(10.5, 10)).toBeCloseTo(5);
        expect(guessErrorPercent(9, 10)).toBeCloseTo(10);
        expect(guessErrorPercent(0, 0)).toBe(0);
    });

    it('rates within 5% as good and within 15% as close', () => {
        expect(rateGuess(0)).toBe('good');
        expect(rateGuess(5)).toBe('good');
        expect(rateGuess(5.01)).toBe('close');
        expect(rateGuess(15)).toBe('close');
        expect(rateGuess(15.1)).toBe('far');
    });
});

describe('run challenge record', () => {
    const state: ChallengeState = {
        key: 'k', value: 23.5, previousValue: 10, revealed: false, attempts: 2, lastGuess: 24, lastErrorPercent: 2.1276595,
    };

    it('round-trips through the stored shape', () => {
        const stored = toRunChallenge(state);
        expect(stored).toEqual({ unknown_key: 'k', true_value: 23.5, guess: 24, error_percent: 2.128, attempts: 2, revealed: false });
        expect(parseRunChallenge(JSON.parse(JSON.stringify(stored)))).toEqual(stored);
    });

    it('reads missing or malformed values as no challenge', () => {
        expect(parseRunChallenge(null)).toBeNull();
        expect(parseRunChallenge([])).toBeNull();
        expect(parseRunChallenge({ unknown_key: 'k' })).toBeNull();
        expect(parseRunChallenge({ unknown_key: 'k', true_value: 3, guess: 'x' })?.guess).toBeNull();
    });
});

describe('omitKeys', () => {
    it('drops hidden keys without touching the source rows', () => {
        const rows = [{ time: 0, position: 1, energy_potential: 5 }];
        expect(omitKeys(rows, ['energy_potential'])).toEqual([{ time: 0, position: 1 }]);
        expect(rows[0].energy_potential).toBe(5);
    });
});
