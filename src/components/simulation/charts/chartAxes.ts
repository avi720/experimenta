import { describeSampleQuantities, type ExperimentGuide, type Quantity } from "@/simulation/guides";

/** Which quantity runs along X and which are plotted against it. */
export type AxisSelection = { x: string; y: string[] };

export type UnitGroup = { unit: string; quantities: Quantity[] };

/**
 * Quantities that can go on a chart axis: the guide's chartable quantities (all of them before a
 * run, the ones present in the data after), or the sample's numeric keys when there is no guide.
 */
export function chartableQuantities(
    guide: ExperimentGuide | null,
    sample: Record<string, unknown> | null | undefined
): Quantity[] {
    const base = guide && !sample ? guide.quantities : describeSampleQuantities(guide, sample);
    return base.filter((q) => q.chartable !== false);
}

/** The starting axes: time (or the guide's first view) on X, the template's outputs on Y. */
export function defaultAxes(
    quantities: ReadonlyArray<Quantity>,
    outputs: ReadonlyArray<string>,
    guide: ExperimentGuide | null
): AxisSelection {
    const has = (key: string) => quantities.some((q) => q.key === key);
    const firstView = guide?.chartViews[0];
    const x = has("time") ? "time" : firstView && has(firstView.x) ? firstView.x : quantities[0]?.key ?? "time";
    const pickY = (keys: ReadonlyArray<string>) => keys.filter((key) => key !== x && has(key));
    let y = pickY(outputs);
    if (y.length === 0 && firstView) y = pickY(firstView.y);
    if (y.length === 0) y = quantities.filter((q) => q.key !== x).slice(0, 1).map((q) => q.key);
    return { x, y };
}

/**
 * Applies the rules a selection must keep: no hidden quantity on either axis, X not repeated on Y,
 * and at least one Y series when any is available.
 */
export function sanitizeAxes(
    selection: AxisSelection,
    quantities: ReadonlyArray<Quantity>,
    hiddenKeys: ReadonlyArray<string>,
    fallback: AxisSelection
): AxisSelection {
    const allowed = (key: string) => quantities.some((q) => q.key === key) && !hiddenKeys.includes(key);
    const x = allowed(selection.x)
        ? selection.x
        : allowed(fallback.x)
        ? fallback.x
        : quantities.find((q) => allowed(q.key))?.key ?? selection.x;
    let y = selection.y.filter((key) => key !== x && allowed(key));
    if (y.length === 0) y = fallback.y.filter((key) => key !== x && allowed(key));
    if (y.length === 0) y = quantities.filter((q) => q.key !== x && allowed(q.key)).slice(0, 1).map((q) => q.key);
    return { x, y };
}

/** Splits the Y series by unit: quantities in different units never share a Y axis. */
export function groupByUnit(keys: ReadonlyArray<string>, quantities: ReadonlyArray<Quantity>): UnitGroup[] {
    const groups: UnitGroup[] = [];
    for (const key of keys) {
        const quantity = quantities.find((q) => q.key === key);
        if (!quantity) continue;
        const group = groups.find((g) => g.unit === quantity.unit);
        if (group) group.quantities.push(quantity);
        else groups.push({ unit: quantity.unit, quantities: [quantity] });
    }
    return groups;
}

/** "[m/s]", or "" for a dimensionless quantity. */
export function axisUnit(quantity: Pick<Quantity, "unit">): string {
    return quantity.unit ? `[${quantity.unit}]` : "";
}

/** Short tick label: three significant figures, no trailing zeros. */
export function formatTick(value: number): string {
    if (!Number.isFinite(value)) return "";
    if (value !== 0 && (Math.abs(value) >= 1e5 || Math.abs(value) < 1e-3)) return value.toExponential(1);
    return String(Number(value.toPrecision(3)));
}
