/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import SimulationControls from "./SimulationControls";

if (!("ResizeObserver" in globalThis)) {
    class ResizeObserverStub {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
}

afterEach(cleanup);

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

describe("SimulationControls direction", () => {
    it("keeps the step buttons in the time bar's direction in Hebrew", () => {
        document.documentElement.dir = "rtl";
        render(<SimulationControls {...handlers} isRTL simulationState="paused" playbackTime={5} maxAvailableTime={10} simulationData={samples} />);
        const back = screen.getByRole("button", { name: "צעד אחורה" });
        const forward = screen.getByRole("button", { name: "צעד קדימה" });
        // Same left-to-right row as the slider: back comes first, forward after it.
        expect(back.parentElement?.getAttribute("dir")).toBe("ltr");
        expect(back.compareDocumentPosition(forward) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(screen.getByRole("slider").closest("[dir]")?.getAttribute("dir")).toBe("ltr");
    });
});
