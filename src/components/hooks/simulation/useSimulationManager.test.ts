import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Lightweight React hook harness for testing useSimulationManager + useSimulationEngineLogic in Node
type Deps = readonly unknown[] | undefined;
type Cleanup = (() => void) | null;
type Effect = { fn: () => void | (() => void); deps: Deps; pending: boolean };

const hookState: {
    states: unknown[];
    refs: { current: unknown }[];
    effects: Effect[];
    cleanups: Cleanup[];
    callbacks: { fn: unknown; deps: Deps }[];
    cursor: number;
    rerender: (() => void) | null;
} = {
    states: [],
    refs: [],
    effects: [],
    cleanups: [],
    callbacks: [],
    cursor: 0,
    rerender: null,
};

function depsChanged(prevDeps: Deps, nextDeps: Deps) {
    if (!prevDeps || !nextDeps) return true;
    if (prevDeps.length !== nextDeps.length) return true;
    for (let i = 0; i < nextDeps.length; i++) {
        if (!Object.is(prevDeps[i], nextDeps[i])) return true;
    }
    return false;
}

vi.mock("react", () => ({
    useState: (initial: unknown) => {
        const idx = hookState.cursor++;
        if (!(idx in hookState.states)) {
            hookState.states[idx] =
                typeof initial === "function" ? (initial as () => unknown)() : initial;
        }
        const setState = (updater: unknown) => {
            const next =
                typeof updater === "function"
                    ? (updater as (prev: unknown) => unknown)(hookState.states[idx])
                    : updater;
            if (!Object.is(hookState.states[idx], next)) {
                hookState.states[idx] = next;
                hookState.rerender?.();
            }
        };
        return [hookState.states[idx], setState];
    },
    useRef: (initial: unknown) => {
        const idx = hookState.cursor++;
        if (!(idx in hookState.refs)) {
            hookState.refs[idx] = { current: initial };
        }
        return hookState.refs[idx];
    },
    useCallback: (fn: unknown, deps: Deps) => {
        const idx = hookState.cursor++;
        const prev = hookState.callbacks[idx];
        if (!prev || depsChanged(prev.deps, deps)) {
            hookState.callbacks[idx] = { fn, deps };
        }
        return hookState.callbacks[idx].fn;
    },
    useEffect: (fn: Effect["fn"], deps: Deps) => {
        const idx = hookState.cursor++;
        const prev = hookState.effects[idx];
        if (!prev || depsChanged(prev.deps, deps)) {
            hookState.effects[idx] = { fn, deps, pending: true };
        }
    },
}));

import { useSimulationManager } from "./useSimulationManager";

function mountHook<T>(renderFn: () => T) {
    hookState.states = [];
    hookState.refs = [];
    hookState.effects = [];
    hookState.cleanups = [];
    hookState.callbacks = [];
    let latestResult!: T;

    const flushEffects = () => {
        for (let i = 0; i < hookState.effects.length; i++) {
            const eff = hookState.effects[i];
            if (eff?.pending) {
                eff.pending = false;
                hookState.cleanups[i]?.();
                hookState.cleanups[i] = eff.fn() || null;
            }
        }
    };

    const render = () => {
        hookState.cursor = 0;
        latestResult = renderFn();
        flushEffects();
    };

    hookState.rerender = render;
    render();

    return {
        get current() {
            return latestResult;
        },
        rerender: render,
        unmount: () => {
            hookState.rerender = null;
            for (let i = 0; i < hookState.cleanups.length; i++) {
                hookState.cleanups[i]?.();
                hookState.cleanups[i] = null;
            }
        },
    };
}

describe("useSimulationManager & useSimulationEngineLogic (T23)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("creates only one playback interval per play and does not rebuild it on every tick", async () => {
        const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
        const stepFn = (t: number) => ({
            time: Number(t.toFixed(3)),
            position: t,
            shouldStop: t >= 0.1,
        });

        const h = mountHook(() =>
            useSimulationManager({
                calculateStepFn: stepFn,
                parameters: {},
                maxSimulationTime: 0.1,
                playbackSpeed: 1.0,
            })
        );

        h.current.startSimulation();
        await vi.advanceTimersByTimeAsync(5);

        expect(h.current.isPlaying).toBe(true);
        expect(setIntervalSpy).toHaveBeenCalledTimes(1);

        // Advance several 16ms playback ticks; interval must NOT be recreated
        await vi.advanceTimersByTimeAsync(16 * 4);
        expect(setIntervalSpy).toHaveBeenCalledTimes(1);
        expect(h.current.playbackTime).toBeGreaterThan(0);

        // Advance past maxAvailableTime (0.1s) -> completes and stops interval
        await vi.advanceTimersByTimeAsync(100);
        expect(h.current.isPlaying).toBe(false);
        expect(h.current.simulationStatus).toBe("completed");
        expect(h.current.playbackTime).toBeCloseTo(0.1, 3);

        setIntervalSpy.mockRestore();
    });

    it("pressing Reset mid-calculation cancels runEngine and leaves status idle with empty data", async () => {
        // 2.5 seconds = 2500 steps -> yields twice at 1000-step boundaries
        const stepFn = (t: number) => ({
            time: Number(t.toFixed(3)),
            position: t,
            shouldStop: false,
        });

        const h = mountHook(() =>
            useSimulationManager({
                calculateStepFn: stepFn,
                parameters: {},
                maxSimulationTime: 2.5,
            })
        );

        h.current.startSimulation();
        expect(h.current.simulationStatus).toBe("calculating");

        // Reset while calculation is yielded mid-run
        h.current.resetSimulation();
        expect(h.current.simulationStatus).toBe("idle");
        expect(h.current.simulationData).toEqual([]);

        // Flush remaining timers — cancelled runEngine must NOT overwrite reset state
        await vi.runAllTimersAsync();
        expect(h.current.simulationStatus).toBe("idle");
        expect(h.current.simulationData).toEqual([]);
        expect(h.current.isPlaying).toBe(false);
    });

    it("unmounting mid-calculation aborts cleanly without mutating state after unmount", async () => {
        const stepFn = (t: number) => ({
            time: Number(t.toFixed(3)),
            position: t,
            shouldStop: false,
        });

        const h = mountHook(() =>
            useSimulationManager({
                calculateStepFn: stepFn,
                parameters: {},
                maxSimulationTime: 2.5,
            })
        );

        h.current.startSimulation();
        h.unmount();

        await vi.runAllTimersAsync();
        expect(h.current.simulationData).toEqual([]);
    });

    it("continueSimulation extends calculation when paused before maxSimulationTime", async () => {
        let maxTime = 0.05;
        const stepFn = (t: number) => ({
            time: Number(t.toFixed(3)),
            position: t,
            shouldStop: false,
        });

        const h = mountHook(() =>
            useSimulationManager({
                calculateStepFn: stepFn,
                parameters: {},
                maxSimulationTime: maxTime,
            })
        );

        h.current.startSimulation();
        await vi.advanceTimersByTimeAsync(200);
        expect(h.current.getMaxAvailableTime()).toBeCloseTo(0.05, 3);

        // Increase maxSimulationTime and call continueSimulation at end of available data
        maxTime = 0.1;
        h.rerender();
        h.current.pauseSimulation();
        h.current.continueSimulation();

        await vi.advanceTimersByTimeAsync(200);
        expect(h.current.getMaxAvailableTime()).toBeCloseTo(0.1, 3);
    });
});
