import type { Bilingual } from '@/types/experiment';

/**
 * Per-experiment teaching content kept in code (not in the template row): the quantities an
 * engine outputs, the equations behind them, and which parameters can be hidden as an unknown.
 */

/** One value in the engine's samples that can be shown in the console and on a chart axis. */
export type Quantity = {
    key: string;
    label: Bilingual;
    /** Short symbol for chart titles and readouts, in plain Unicode (e.g. "Eₖ"). */
    symbol: string;
    /** SI-style unit as shown to the user; empty for dimensionless values. */
    unit: string;
    /**
     * Parameter keys whose value this quantity gives away. While one of them is the unknown the
     * quantity is hidden. Measurable kinematics (x, v, a) stay visible unless they equal the
     * unknown outright; energies and derived constants are hidden when they depend on it.
     */
    reveals?: string[];
    /** False for per-run constants (e.g. the period) that make a flat, useless chart line. */
    chartable?: boolean;
};

export type Formula = {
    id: string;
    name: Bilingual;
    /** KaTeX source. */
    tex: string;
    /** One or two plain sentences for a non-expert reader. */
    description: Bilingual;
    /** Parameter keys that appear in the equation, used to highlight it for the chosen unknown. */
    uses: string[];
};

export type FormulaGroup = {
    title: Bilingual;
    formulas: Formula[];
};

/** A row of the symbol legend under the equations. */
export type SymbolEntry = {
    /** KaTeX source. */
    tex: string;
    meaning: Bilingual;
    unit: string;
};

/** A parameter that can be hidden: the range its secret value is drawn from, and a hint. */
export type UnknownSpec = {
    key: string;
    /** Symbol used in the equations, in plain Unicode (e.g. "λ"). */
    symbol: string;
    /** Draw range, kept inside the template's min/max and away from values that are hard to measure. */
    min: number;
    max: number;
    step: number;
    hint: Bilingual;
};

/** A ready-made choice of chart axes. */
export type ChartView = {
    name: Bilingual;
    x: string;
    y: string[];
};

export type ExperimentGuide = {
    quantities: Quantity[];
    formulas: FormulaGroup[];
    symbols: SymbolEntry[];
    unknowns: UnknownSpec[];
    chartViews: ChartView[];
};
