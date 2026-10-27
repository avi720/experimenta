// Shared CSV export used by the simulation workspace and the Results page.

function quoteIfNeeded(text: string): string {
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Serializes one cell: numbers to 6 decimals (non-finite → empty), `{ y }` vectors to their y,
 * other objects to quoted JSON, null/undefined to empty.
 */
export function serializeCsvCell(value: unknown): string {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value.toFixed(6) : '';
    }
    if (value && typeof value === 'object') {
        const { y } = value as { y?: unknown };
        if (typeof y === 'number') {
            return y.toFixed(6);
        }
        return quoteIfNeeded(JSON.stringify(value));
    }
    if (value === null || value === undefined) {
        return '';
    }
    return quoteIfNeeded(String(value));
}

/**
 * Turns an array of sample objects into a CSV string. Columns default to the keys of the
 * first row; pass `columns` to choose and order them.
 */
export function samplesToCsv(rows: ReadonlyArray<Record<string, unknown>> | null | undefined, columns?: readonly string[]): string {
    if (!Array.isArray(rows) || rows.length === 0) return '';
    const keys = Array.isArray(columns) ? columns : Object.keys(rows[0] || {});
    const header = keys.map((key) => quoteIfNeeded(String(key))).join(',');
    const lines = rows.map((row) => keys.map((key) => serializeCsvCell(row?.[key])).join(','));
    return [header, ...lines].join('\n');
}

/** Triggers a browser download of `csvText` under `filename`. */
export function downloadCsv(csvText: string, filename: string): void {
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
