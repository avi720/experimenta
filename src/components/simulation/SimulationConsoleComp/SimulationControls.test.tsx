/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SimulationControls from "./SimulationControls";

if (!("ResizeObserver" in globalThis)) {
    class ResizeObserverStub {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
}

const noop = () => {};
const handlers = {
    onStart: noop, onPause: noop, onContinue: noop, onReset: noop,
    onStepForward: noop, onStepBackward: noop, onScrub: noop,
};
const samples = Array.from({ length: 11 }, (_, i) => ({ time: i }));

/** The thumb's offset along the bar, as Radix writes it ("calc(0% + 8px)" at the start). */
const thumbOffset = () => screen.getByRole("slider").parentElement?.getAttribute("style") ?? "";

describe("SimulationControls time bar", () => {
    it("goes back to the start when a finished run is reset", () => {
        const { rerender } = render(
            <SimulationControls {...handlers} isRTL simulationState="completed" playbackTime={10} maxAvailableTime={10} simulationData={samples} />
        );
        expect(thumbOffset()).toContain("calc(100%");

        // Reset clears the data and the time.
        rerender(<SimulationControls {...handlers} isRTL simulationState="idle" playbackTime={0} maxAvailableTime={0} simulationData={[]} />);
        expect(thumbOffset()).toContain("calc(0%");
    });
});
