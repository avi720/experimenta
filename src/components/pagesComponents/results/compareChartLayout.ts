/**
 * Room around the Compare chart. The last x tick sits on the domain end and its label is
 * centered on that tick, so half of the text hangs past the axis. Padding pulls the tick
 * back into the plot and the right margin keeps that overhang inside the svg. Both are
 * fixed pixels, so a narrow chart does not eat the label.
 */

export const COMPARE_CHART_MARGIN = { top: 8, right: 16, bottom: 24, left: 8 } as const;

export const COMPARE_X_AXIS_PADDING = { left: 0, right: 32 } as const;

/** IBM Plex Mono at the tick size is about 0.6em per character. */
const TICK_FONT_PX = 12;
const MONO_CHAR_EM = 0.6;
/** A few pixels so the last glyph is not flush with the svg edge. */
const TICK_EDGE_GAP_PX = 6;

/** Values the tick formatter can turn into the widest labels. */
const CLEARANCE_SAMPLES = [3.193, 0, -0.5, 9999.999, -9999.999, 1e20, -1e20, 1e-4, -1e-4];

export function formatAxisTick(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 0.01 || abs >= 10000)) return value.toExponential(1);
  return String(Math.round(value * 1000) / 1000);
}

/** Pixels a centered tick label needs on the outer side of its tick. */
export function centeredTickClearance(label: string): number {
  const half = (label.length * TICK_FONT_PX * MONO_CHAR_EM) / 2;
  return Math.ceil(half) + TICK_EDGE_GAP_PX;
}

/** How far the last x tick sits from the right edge of the svg. */
export function compareXRightInset(): number {
  return COMPARE_CHART_MARGIN.right + COMPARE_X_AXIS_PADDING.right;
}

/** The inset the widest tick the formatter emits still needs. */
export function requiredXRightInset(values: readonly number[] = CLEARANCE_SAMPLES): number {
  let widest = 1;
  for (const value of values) {
    widest = Math.max(widest, formatAxisTick(value).length);
  }
  return centeredTickClearance("0".repeat(widest));
}
