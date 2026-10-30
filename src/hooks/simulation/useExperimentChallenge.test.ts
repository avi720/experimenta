/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { useExperimentChallenge } from './useExperimentChallenge';
import type { Parameter, ParameterValues } from '@/types/experiment';

const param = (key: string, min: number, max: number): Parameter => ({ key, type: 'float', min, max, is_active: true, i18n_labels: { he: key, en: key } });
const sho = { slug: 'sho', parameters: [param('m', 0.1, 20), param('k', 0.1, 200), param('x0', -5, 5), param('v0', -10, 10), param('c', 0, 10)] };

function setup() {
    return renderHook(() => {
        const [parameters, setParameters] = useState<ParameterValues>({ m: 1, k: 10, x0: 1, v0: 0, c: 0 });
        return { parameters, setParameters, challenge: useExperimentChallenge(sho, parameters, setParameters) };
    });
}

describe('useExperimentChallenge', () => {
    it('offers only the parameters the guide allows', () => {
        const { result } = setup();
        expect(result.current.challenge.options.map((o) => o.spec.key)).toEqual(['k', 'm', 'c']);
    });

    it('runs the engine with a drawn secret and hides what gives it away', () => {
        const { result } = setup();
        act(() => result.current.challenge.start('k'));
        const secret = result.current.challenge.state!.value;
        expect(secret).toBeGreaterThanOrEqual(2);
        expect(secret).toBeLessThanOrEqual(60);
        expect(result.current.parameters.k).toBe(secret);
        expect(result.current.challenge.hiddenKeys).toContain('energy_potential');
    });

    it('puts the secret back when a preset or reset overwrites it', () => {
        const { result } = setup();
        act(() => result.current.challenge.start('k'));
        const secret = result.current.challenge.state!.value;
        act(() => result.current.setParameters((prev) => ({ ...prev, k: 100 })));
        expect(result.current.parameters.k).toBe(secret);
    });

    it('restores the original value when switching unknowns or leaving the mode', () => {
        const { result } = setup();
        act(() => result.current.challenge.start('k'));
        act(() => result.current.challenge.start('m'));
        expect(result.current.parameters.k).toBe(10);
        expect(result.current.challenge.state!.key).toBe('m');
        act(() => result.current.challenge.stop());
        expect(result.current.parameters.m).toBe(1);
        expect(result.current.challenge.state).toBeNull();
        expect(result.current.challenge.hiddenKeys).toEqual([]);
    });

    it('scores guesses, and records the run only while the secret is in use', () => {
        const { result } = setup();
        act(() => result.current.challenge.start('k'));
        const secret = result.current.challenge.state!.value;
        act(() => result.current.challenge.checkGuess(secret * 1.02));
        expect(result.current.challenge.state!.lastErrorPercent).toBeCloseTo(2);
        expect(result.current.challenge.runChallenge).toMatchObject({ unknown_key: 'k', true_value: secret, attempts: 1, revealed: false });

        act(() => result.current.challenge.reveal());
        expect(result.current.challenge.isHiding).toBe(false);
        expect(result.current.challenge.hiddenKeys).toEqual([]);
        // Editing the revealed value makes it an ordinary run again.
        act(() => result.current.setParameters((prev) => ({ ...prev, k: secret + 1 })));
        expect(result.current.challenge.runChallenge).toBeNull();
    });
});
