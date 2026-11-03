import { describe, expect, it } from "vitest";
import type { Sample } from "@/types/results";
import {
  buildRunOverlay,
  comparableRuns,
  compareParameters,
  compareRunLabel,
  defaultOverlayAxes,
  sharedNumericKeys,
} from "./compareRuns";

const formatDate = (date: string | null | undefined) => date ?? "";

describe("comparableRuns", () => {
  const runs = [
    { id: "a", experiment_slug: "free-fall" },
    { id: "b", experiment_slug: "free-fall" },
    { id: "c", experiment_slug: "sho" },
    { id: "d", experiment_slug: null },
  ];

  it("returns other runs of the same experiment, in the given order", () => {
    expect(comparableRuns(runs, runs[0]).map((run) => run.id)).toEqual(["b"]);
  });

  it("does not pair a run with a different experiment or with itself", () => {
    expect(comparableRuns(runs, runs[2]).map((run) => run.id)).toEqual([]);
  });

  it("does not treat a missing experiment as a match", () => {
    const unnamed = [
      { id: "d", experiment_slug: null },
      { id: "e", experiment_slug: null },
    ];
    expect(comparableRuns(unnamed, unnamed[0])).toEqual([]);
  });
});

describe("compareRunLabel", () => {
  it("uses trimmed notes, and the date when notes are blank", () => {
    const dated = { id: "a", created_date: "2026-10-20", notes: "  " };
    const named = { id: "b", created_date: "2026-10-21", notes: " high drop " };
    expect(compareRunLabel(dated, [dated, named], formatDate)).toBe("2026-10-20");
    expect(compareRunLabel(named, [dated, named], formatDate)).toBe("high drop");
  });

  it("adds a short id only when two runs would share a label", () => {
    const first = { id: "abcd-1", created_date: "2026-10-20", notes: "" };
    const second = { id: "efgh-2", created_date: "2026-10-20", notes: null };
    expect(compareRunLabel(first, [first, second], formatDate)).toBe("2026-10-20 · abcd");
    expect(compareRunLabel(second, [first, second], formatDate)).toBe("2026-10-20 · efgh");
  });
});

describe("compareParameters", () => {
  it("lists changed values and keys that exist on only one run", () => {
    const comparison = compareParameters(
      { h0: 10, g: 9.81, drag: 0.2 },
      { g: 9.81, h0: 20, extra: true },
    );
    expect(comparison.unchangedCount).toBe(1);
    expect(comparison.differences).toEqual([
      { key: "drag", left: 0.2, right: undefined, kind: "only_left" },
      { key: "extra", left: undefined, right: true, kind: "only_right" },
      { key: "h0", left: 10, right: 20, kind: "changed" },
    ]);
  });

  it("treats equal numbers and objects with a different key order as unchanged", () => {
    const comparison = compareParameters(
      { h0: 10, setup: { b: 1, a: 2 } },
      { setup: { a: 2, b: 1 }, h0: 10 },
    );
    expect(comparison.differences).toEqual([]);
    expect(comparison.unchangedCount).toBe(2);
  });

  it("treats a number and the same digits in a string as different", () => {
    const comparison = compareParameters({ h0: 10 }, { h0: "10" });
    expect(comparison.differences).toEqual([
      { key: "h0", left: 10, right: "10", kind: "changed" },
    ]);
  });
});

describe("sharedNumericKeys and defaultOverlayAxes", () => {
  const left: Sample[] = [
    { time: 0, position: "pending", velocity: 1 },
    { time: 1, position: 5, note: "landed" },
  ];
  const right: Sample[] = [
    { time: 0, position: 8, energy: 3 },
    { time: 2, position: 0, energy: 3 },
  ];

  it("keeps keys that are numeric in both runs, including a value that arrives on a later row", () => {
    expect(sharedNumericKeys(left, right)).toEqual(["time", "position"]);
  });

  it("defaults to time against position when both runs recorded them", () => {
    expect(defaultOverlayAxes(sharedNumericKeys(left, right))).toEqual({ x: "time", y: "position" });
  });

  it("returns no axes when the runs share fewer than two numeric keys", () => {
    expect(defaultOverlayAxes(["time"])).toBeNull();
    expect(sharedNumericKeys([], right)).toEqual([]);
  });
});

describe("buildRunOverlay", () => {
  it("keeps each run on its own grid when the durations and sample times differ", () => {
    const left: Sample[] = [
      { time: 0, position: 10 },
      { time: 0.5, position: 8 },
      { time: 1, position: 5 },
    ];
    const right: Sample[] = [
      { time: 0, position: 20 },
      { time: 0.3, position: 16 },
      { time: 2, position: 4 },
      { time: 5, position: 0 },
    ];

    const overlay = buildRunOverlay(left, right, "time", "position");

    expect(overlay.left).toEqual([
      { x: 0, y: 10 },
      { x: 0.5, y: 8 },
      { x: 1, y: 5 },
    ]);
    expect(overlay.right.map((point) => point.x)).toEqual([0, 0.3, 2, 5]);
    // No invented sample at the other run's times, and the longer run keeps its tail.
    expect(overlay.left.some((point) => point.x === 0.3 || point.x === 5)).toBe(false);
    expect(overlay.right.some((point) => point.x === 0.5)).toBe(false);
    expect(overlay.xDomain).toEqual([0, 5]);
    expect(overlay.yDomain?.[0]).toBe(0);
    expect(overlay.yDomain?.[1]).toBeGreaterThanOrEqual(20);
  });

  it("sorts by x, drops non-numeric samples, and keeps the later value at a repeated x", () => {
    const samples: Sample[] = [
      { time: 2, position: 1 },
      { time: 0, position: 4 },
      { time: 2, position: 9 },
      { time: 1, position: "pending" },
      { time: Number.POSITIVE_INFINITY, position: 3 },
    ];
    const overlay = buildRunOverlay(samples, [], "time", "position");
    expect(overlay.left).toEqual([
      { x: 0, y: 4 },
      { x: 2, y: 9 },
    ]);
    expect(overlay.right).toEqual([]);
  });

  it("gives a constant series a non-zero domain so the point can be drawn", () => {
    const overlay = buildRunOverlay(
      [{ time: 1, position: 3 }],
      [{ time: 1, position: 3 }],
      "time",
      "position",
    );
    expect(overlay.xDomain?.[0]).toBeLessThan(1);
    expect(overlay.xDomain?.[1]).toBeGreaterThan(1);
    expect(overlay.yDomain?.[0]).toBeLessThan(3);
    expect(overlay.yDomain?.[1]).toBeGreaterThan(3);
  });
});
