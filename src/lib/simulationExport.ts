// CSV the workspace Export button and the Results table both download.
import { formatCsvNumber, samplesToCsv } from '@/lib/csv';

/** One stored sample: numeric values rounded, nested `position.y` flattened, objects dropped. */
export type StoredSample = Record<string, unknown>;

export const MAX_STORED_SAMPLES = 500;

/** Keys the engines attach for the player, not for a student's spreadsheet. */
export const OMITTED_SAMPLE_KEYS = ['shouldStop', 'debug', 'pattern', 'parameters'] as const;

const OMITTED = new Set<string>(OMITTED_SAMPLE_KEYS);

function roundNumeric(val: number): number {
    if (!Number.isFinite(val)) return val;
    const text = formatCsvNumber(val);
    return text === '' ? val : Number(text);
}

/**
 * Indices `serializeSimulationSamples` keeps when a run is longer than `maxSamples`.
 * The last sample is always kept, so an impact or a final reading is never dropped.
 */
export function storedSampleIndices(total: number, maxSamples = MAX_STORED_SAMPLES): number[] {
    if (total <= 0) return [];
    if (total <= maxSamples) {
        return Array.from({ length: total }, (_, index) => index);
    }
    const indices: number[] = [];
    for (let i = 0; i < maxSamples - 1; i++) {
        indices.push(Math.floor((i * (total - 1)) / (maxSamples - 1)));
    }
    indices.push(total - 1);
    return indices;
}

/**
 * Normalizes and downsamples simulation points for persistent storage so
 * Results can render the exact saved dataset without re-running the physics.
 */
export function serializeSimulationSamples(
    simulationData: ReadonlyArray<unknown> | null | undefined,
    maxSamples = MAX_STORED_SAMPLES
): StoredSample[] {
    if (!Array.isArray(simulationData) || simulationData.length === 0) {
        return [];
    }

    const selectedPoints = storedSampleIndices(simulationData.length, maxSamples).map(
        (index) => simulationData[index]
    );

    // Non-object points carry no sample values and are skipped.
    return selectedPoints.flatMap((point) => {
        if (!point || typeof point !== 'object') return [];
        const clean: StoredSample = {};
        for (const [key, val] of Object.entries(point) as [string, unknown][]) {
            if (OMITTED.has(key)) continue;
            if (key === 'position' && val && typeof val === 'object' && 'y' in val && typeof val.y === 'number') {
                clean.position = roundNumeric(val.y);
            } else if (typeof val === 'number') {
                clean[key] = roundNumeric(val);
            } else if (val === null || (val !== undefined && typeof val !== 'object')) {
                // null is an object in JS. Keep it so a column that starts empty
                // (measurement still to come) is present on the first saved row.
                clean[key] = val;
            }
        }
        return [clean];
    });
}

/**
 * Parses stored samples from `run.results_url` if present, returning null for legacy runs.
 */
export function parseStoredSimulationSamples(resultsUrl: unknown): StoredSample[] | null {
    if (!resultsUrl || typeof resultsUrl !== 'string') return null;
    const trimmed = resultsUrl.trim();
    if (!trimmed.startsWith('[')) return null;
    try {
        const parsed: unknown = JSON.parse(trimmed);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch {
        return null;
    }
}

/** CSV text the workspace Export button writes for the live samples. */
export function exportWorkspaceCsv(rows: ReadonlyArray<object> | null | undefined): string {
    if (!Array.isArray(rows) || rows.length === 0) return '';
    const keys = Object.keys(rows[0]).filter((key) => !OMITTED.has(key));
    return samplesToCsv(rows as ReadonlyArray<Record<string, unknown>>, keys);
}

/** CSV text the Results page writes for samples loaded from a saved run. */
export function exportStoredSamplesCsv(
    rows: ReadonlyArray<Record<string, unknown>> | null | undefined
): string {
    return samplesToCsv(rows);
}
