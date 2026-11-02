import { describe, expect, it } from "vitest";
import {
  centeredTickClearance,
  compareXRightInset,
  formatAxisTick,
  requiredXRightInset,
} from "./compareChartLayout";

describe("compare chart x-axis inset", () => {
  it("keeps the last tick, including 3.193, inside the svg", () => {
    expect(compareXRightInset()).toBeGreaterThanOrEqual(centeredTickClearance("3.193"));
    expect(compareXRightInset()).toBeGreaterThanOrEqual(centeredTickClearance(formatAxisTick(3.193)));
  });

  it("fits the widest tick the formatter can emit, at any chart width", () => {
    expect(formatAxisTick(-9999.999).length).toBeGreaterThan("3.193".length);
    expect(compareXRightInset()).toBeGreaterThanOrEqual(requiredXRightInset());
  });
});
