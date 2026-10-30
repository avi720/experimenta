import type { UnknownSpec } from './guides';

/**
 * "Find the unknown": one parameter gets a secret random value and the student works it out from
 * the measurements. Pure helpers; the state lives in `useExperimentChallenge`.
 */

export type GuessRating = 'good' | 'close' | 'far';

export type ChallengeState = {
    key: string;
    /** The secret value the engine runs with. */
    value: number;
    /** The parameter's value before the challenge, restored when the student leaves it. */
    previousValue: unknown;
    revealed: boolean;
    attempts: number;
    lastGuess: number | null;
    lastErrorPercent: number | null;
};

/** What a saved run stores in `experiment_runs.challenge`. */
export type RunChallenge = {
    unknown_key: string;
    true_value: number;
    guess: number | null;
    error_percent: number | null;
    attempts: number;
    revealed: boolean;
};

const GOOD_PERCENT = 5;
const CLOSE_PERCENT = 15;

function decimalsOf(step: number): number {
    const text = String(step);
    if (text.includes('e-')) return Number(text.split('e-')[1]);
    return (text.split('.')[1] || '').length;
}

/**
 * Draws a value on the spec's step grid inside [min, max], further clamped to the template's own
 * limits so the drawn value always passes parameter validation.
 */
export function drawUnknownValue(
    spec: Pick<UnknownSpec, 'min' | 'max' | 'step'>,
    limits: { min?: number; max?: number } = {},
    random: () => number = Math.random
): number {
    const lo = Math.max(spec.min, Number.isFinite(limits.min) ? (limits.min as number) : -Infinity);
    const hi = Math.min(spec.max, Number.isFinite(limits.max) ? (limits.max as number) : Infinity);
    const steps = Math.max(0, Math.floor((hi - lo) / spec.step + 1e-9));
    const index = Math.min(steps, Math.floor(random() * (steps + 1)));
    return Number((lo + index * spec.step).toFixed(decimalsOf(spec.step)));
}

/** Relative error of a guess, in percent. */
export function guessErrorPercent(guess: number, truth: number): number {
    if (truth === 0) return guess === 0 ? 0 : Infinity;
    return (Math.abs(guess - truth) / Math.abs(truth)) * 100;
}

export function rateGuess(errorPercent: number): GuessRating {
    if (errorPercent <= GOOD_PERCENT) return 'good';
    if (errorPercent <= CLOSE_PERCENT) return 'close';
    return 'far';
}

export function toRunChallenge(state: ChallengeState): RunChallenge {
    return {
        unknown_key: state.key,
        true_value: state.value,
        guess: state.lastGuess,
        error_percent: state.lastErrorPercent === null ? null : Number(state.lastErrorPercent.toFixed(3)),
        attempts: state.attempts,
        revealed: state.revealed,
    };
}

/** Reads `experiment_runs.challenge`; null for runs without one or with an unexpected shape. */
export function parseRunChallenge(value: unknown): RunChallenge | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.unknown_key !== 'string' || typeof record.true_value !== 'number') return null;
    const numberOrNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    return {
        unknown_key: record.unknown_key,
        true_value: record.true_value,
        guess: numberOrNull(record.guess),
        error_percent: numberOrNull(record.error_percent),
        attempts: typeof record.attempts === 'number' ? record.attempts : 0,
        revealed: record.revealed === true,
    };
}

/** Copies of the samples without the hidden keys (for CSV export during a challenge). */
export function omitKeys<T extends Record<string, unknown>>(rows: ReadonlyArray<T>, keys: ReadonlyArray<string>): T[] {
    if (keys.length === 0) return rows.slice();
    return rows.map((row) => {
        const copy = { ...row };
        for (const key of keys) delete copy[key];
        return copy;
    });
}
