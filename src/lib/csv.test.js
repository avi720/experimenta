import { describe, it, expect } from "vitest";
import { samplesToCsv, serializeCsvCell } from "./csv.js";

describe("csv utility (T22)", () => {
  it("serializes cells consistently", () => {
    expect(serializeCsvCell(1.5)).toBe("1.500000");
    expect(serializeCsvCell(Number.NaN)).toBe("");
    expect(serializeCsvCell({ x: 1, y: 2 })).toBe("2.000000");
    expect(serializeCsvCell({ a: 1 })).toBe('"{""a"":1}"');
    expect(serializeCsvCell(null)).toBe("");
    expect(serializeCsvCell("a,b")).toBe('"a,b"');
    expect(serializeCsvCell("plain")).toBe("plain");
  });

  it("uses first-row keys as columns by default", () => {
    const csv = samplesToCsv([
      { time: 0, position: 10 },
      { time: 0.1, position: 9.95 },
    ]);
    expect(csv).toBe("time,position\n0.000000,10.000000\n0.100000,9.950000");
  });

  it("respects an explicit column order and returns empty string for no rows", () => {
    expect(samplesToCsv([{ a: 1, b: 2, debug: "x" }], ["b", "a"])).toBe("b,a\n2.000000,1.000000");
    expect(samplesToCsv([])).toBe("");
    expect(samplesToCsv(null)).toBe("");
  });
});
