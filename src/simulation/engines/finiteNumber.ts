import type { ParameterValue } from './types';

/** A missing or non-numeric input uses `fallback`. A real zero stays zero. */
export function finiteOr(value: ParameterValue, fallback: number): number {
    const parsed = parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : fallback;
}
