import { describe, it, expect } from "vitest";
import { computeBarrierVisualWidth } from "./QuantumTunnelingScene.jsx";
import { calculateQuantumTunnelingStep } from "../engines/quantumTunnelingEngine.jsx";

describe("QuantumTunnelingScene barrier width scaling (T49)", () => {
    it("scales barrier_width_um from the engine into visible scene units", () => {
        const pointDefault = calculateQuantumTunnelingStep(0, { L: 0.005 });
        const pointWide = calculateQuantumTunnelingStep(0, { L: 0.01 });
        const pointNarrow = calculateQuantumTunnelingStep(0, { L: 0.001 });

        const widthDefault = computeBarrierVisualWidth({ L: 0.005 }, pointDefault);
        const widthWide = computeBarrierVisualWidth({ L: 0.01 }, pointWide);
        const widthNarrow = computeBarrierVisualWidth({ L: 0.001 }, pointNarrow);

        // 0.005 µm = 5 nm -> 5 * 0.25 = 1.25 scene units (not 0.00125)
        expect(widthDefault).toBeCloseTo(1.25, 5);
        expect(widthWide).toBeCloseTo(2.5, 5);
        expect(widthNarrow).toBeCloseTo(0.25, 5);
        expect(widthWide).toBeGreaterThan(widthDefault);
        expect(widthDefault).toBeGreaterThan(widthNarrow);
    });

    it("computes visual width directly from parameters.L before playback starts", () => {
        expect(computeBarrierVisualWidth({ L: 0.008 }, null)).toBeCloseTo(2.0, 5);
    });
});
