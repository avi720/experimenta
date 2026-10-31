import type { Sample } from "@/types/results";

/**
 * Overlay of two saved runs. Each series keeps its own samples: a longer run is not
 * truncated, and mismatched time grids are not resampled or interpolated.
 */

export type OverlayPoint = { x: number; y: number };

export type RunOverlay = {
  left: OverlayPoint[];
  right: OverlayPoint[];
  /** Exact x extent of both series. Null when neither series has points. */
  xDomain: [number, number] | null;
  /** Y extent of both series, padded so a stroke is not clipped. Null when neither has points. */
  yDomain: [number, number] | null;
};

export type ParameterDifference = {
  key: string;
  left: unknown;
  right: unknown;
  kind: "changed" | "only_left" | "only_right";
};

export type ParameterComparison = {
  differences: ParameterDifference[];
  unchangedCount: number;
};

export type CompareRunIdentity = {
  id: string;
  experiment_slug: string | null;
};

export type CompareRunLabelSource = {
  id: string;
  created_date: string | null;
  notes?: string | null;
};

/** Quantities a student most often plots, tried in order when picking a default Y axis. */
const PREFERRED_Y_AXES = ["position", "velocity", "angle", "intensity"];

/** Padding so a flat line is not clipped by the axis, and a constant series still has a range. */
const Y_PAD_RATIO = 0.05;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parameterValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== "object" || typeof right !== "object" || left === null || right === null) {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    for (let i = 0; i < left.length; i++) {
      if (!parameterValuesEqual(left[i], right[i])) return false;
    }
    return true;
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord);
  if (leftKeys.length !== Object.keys(rightRecord).length) return false;
  for (const key of leftKeys) {
    if (!Object.prototype.hasOwnProperty.call(rightRecord, key)) return false;
    if (!parameterValuesEqual(leftRecord[key], rightRecord[key])) return false;
  }
  return true;
}

function extent(values: readonly number[], padRatio: number): [number, number] | null {
  if (values.length === 0) return null;
  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    const value = values[i];
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min === max) {
    const pad = min === 0 ? 1 : Math.abs(min) * 0.05;
    return [min - pad, max + pad];
  }
  if (padRatio === 0) return [min, max];
  const pad = (max - min) * padRatio;
  let low = min - pad;
  let high = max + pad;
  // A height that never goes below the ground should not grow a negative axis.
  if (min >= 0) low = Math.max(0, low);
  if (max <= 0) high = Math.min(0, high);
  return [low, high];
}

/** Other saved runs of the same experiment. A missing slug never matches, including another missing slug. */
export function comparableRuns<T extends CompareRunIdentity>(
  runs: readonly T[],
  selected: CompareRunIdentity,
): T[] {
  if (!selected.experiment_slug) return [];
  return runs.filter(
    (run) => run.id !== selected.id && run.experiment_slug === selected.experiment_slug,
  );
}

/**
 * Label for a legend or menu: the run's notes when they were saved, otherwise the date.
 * Identical labels in the same group gain a short id so two runs can be told apart.
 */
export function compareRunLabel(
  run: CompareRunLabelSource,
  peers: readonly CompareRunLabelSource[],
  formatDate: (date: string | null | undefined) => string,
): string {
  const notes = typeof run.notes === "string" ? run.notes.trim() : "";
  const base = notes || formatDate(run.created_date) || run.id;
  const collision = peers.some((peer) => {
    if (peer.id === run.id) return false;
    const peerNotes = typeof peer.notes === "string" ? peer.notes.trim() : "";
    const peerBase = peerNotes || formatDate(peer.created_date) || peer.id;
    return peerBase === base;
  });
  if (!collision) return base;
  const suffix = run.id.length > 4 ? run.id.slice(0, 4) : run.id;
  return `${base} · ${suffix}`;
}

/** Keys whose values differ, plus how many keys are the same. Key order does not matter. */
export function compareParameters(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): ParameterComparison {
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort((a, b) => a.localeCompare(b));
  const differences: ParameterDifference[] = [];
  let unchangedCount = 0;
  for (const key of keys) {
    const inLeft = Object.prototype.hasOwnProperty.call(left, key);
    const inRight = Object.prototype.hasOwnProperty.call(right, key);
    if (inLeft && inRight) {
      if (parameterValuesEqual(left[key], right[key])) {
        unchangedCount += 1;
      } else {
        differences.push({ key, left: left[key], right: right[key], kind: "changed" });
      }
    } else if (inLeft) {
      differences.push({ key, left: left[key], right: undefined, kind: "only_left" });
    } else {
      differences.push({ key, left: undefined, right: right[key], kind: "only_right" });
    }
  }
  return { differences, unchangedCount };
}

function numericKeysInSamples(samples: readonly Sample[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const sample of samples) {
    for (const key of Object.keys(sample)) {
      if (seen.has(key)) continue;
      if (isFiniteNumber(sample[key])) {
        seen.add(key);
        keys.push(key);
      }
    }
  }
  return keys;
}

/** Numeric keys present in both runs, in the first run's order. */
export function sharedNumericKeys(left: readonly Sample[], right: readonly Sample[]): string[] {
  const rightKeys = new Set(numericKeysInSamples(right));
  return numericKeysInSamples(left).filter((key) => rightKeys.has(key));
}

/** Default axes: time on X when both runs have it, then a shared quantity on Y. */
export function defaultOverlayAxes(keys: readonly string[]): { x: string; y: string } | null {
  if (keys.length < 2) return null;
  const x = keys.includes("time") ? "time" : keys[0];
  let y = "";
  for (const preferred of PREFERRED_Y_AXES) {
    if (preferred !== x && keys.includes(preferred)) {
      y = preferred;
      break;
    }
  }
  if (!y) {
    for (const key of keys) {
      if (key !== x) {
        y = key;
        break;
      }
    }
  }
  if (!y || y === x) return null;
  return { x, y };
}

/**
 * Points for one series. Rows missing a finite x or y are dropped. Duplicate x keeps the
 * later sample. Nothing is interpolated onto the other run's grid.
 */
function seriesPoints(samples: readonly Sample[], xKey: string, yKey: string): OverlayPoint[] {
  const yByX = new Map<number, number>();
  for (const sample of samples) {
    const x = sample[xKey];
    const y = sample[yKey];
    if (!isFiniteNumber(x) || !isFiniteNumber(y)) continue;
    yByX.set(x, y);
  }
  const points: OverlayPoint[] = [];
  for (const [x, y] of yByX) {
    points.push({ x, y });
  }
  points.sort((a, b) => a.x - b.x);
  return points;
}

export function buildRunOverlay(
  leftSamples: readonly Sample[],
  rightSamples: readonly Sample[],
  xKey: string,
  yKey: string,
): RunOverlay {
  const left = seriesPoints(leftSamples, xKey, yKey);
  const right = seriesPoints(rightSamples, xKey, yKey);
  const xs: number[] = [];
  const ys: number[] = [];
  for (const point of left) {
    xs.push(point.x);
    ys.push(point.y);
  }
  for (const point of right) {
    xs.push(point.x);
    ys.push(point.y);
  }
  return {
    left,
    right,
    xDomain: extent(xs, 0),
    yDomain: extent(ys, Y_PAD_RATIO),
  };
}
