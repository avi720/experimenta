import type { ExperimentGuide, Quantity } from './types';
import { shoGuide } from './shoGuide';
import { freeFallGuide } from './freeFallGuide';
import { quantumTunnelingGuide } from './quantumTunnelingGuide';
import { doubleSlitGuide } from './doubleSlitGuide';

export type { ChartView, ExperimentAbout, ExperimentGuide, Formula, FormulaGroup, Quantity, SymbolEntry, UnknownSpec } from './types';

/** Teaching content per experiment slug (the same slugs as `EXPERIMENT_REGISTRY`). */
export const EXPERIMENT_GUIDES: Readonly<Record<string, ExperimentGuide | undefined>> = {
    sho: shoGuide,
    'free-fall': freeFallGuide,
    'quantum-tunneling': quantumTunnelingGuide,
    'double-slit': doubleSlitGuide,
};

export function getExperimentGuide(slug: string | null | undefined): ExperimentGuide | null {
    return (slug && EXPERIMENT_GUIDES[slug]) || null;
}

/** Keys of the quantities that give away `unknownKey`; empty when there is no unknown. */
export function hiddenQuantityKeys(guide: ExperimentGuide | null, unknownKey: string | null | undefined): string[] {
    if (!guide || !unknownKey) return [];
    return guide.quantities.filter((q) => q.reveals?.includes(unknownKey)).map((q) => q.key);
}

/**
 * The numeric quantities present in a sample, described by the guide where it knows them. Keys the
 * guide does not list are dropped when there is a guide (e.g. Free Fall's duplicate `position_y`),
 * and shown under their raw key when there is none.
 */
export function describeSampleQuantities(
    guide: ExperimentGuide | null,
    sample: Record<string, unknown> | null | undefined
): Quantity[] {
    if (!sample) return [];
    const isNumber = (key: string) => typeof sample[key] === 'number';
    if (guide) {
        return guide.quantities.filter((q) => isNumber(q.key));
    }
    return Object.keys(sample)
        .filter(isNumber)
        .map((key) => ({ key, label: { he: key, en: key }, symbol: key, unit: '' }));
}
