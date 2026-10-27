import { describe, it, expect, vi, beforeEach } from "vitest";

const toastMocks = vi.hoisted(() => ({
    info: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
}));
const authMock = vi.hoisted(() => ({
    isAuthenticated: true,
    navigateToLogin: vi.fn(),
    user: { locale_preference: "he" },
    guestLocale: null,
}));

vi.mock("react", () => ({
    useCallback: (fn: unknown) => fn,
    useMemo: (fn: () => unknown) => fn(),
    useContext: () => authMock,
    createContext: () => ({ Provider: ({ children }: { children?: unknown }) => children }),
    useEffect: vi.fn(),
    createElement: vi.fn(),
}));
vi.mock("sonner", () => ({
    toast: toastMocks,
}));
const createRunMock = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/useDataQueries", () => ({
    useExperimentRunMutations: () => ({ createRun: createRunMock }),
}));
vi.mock("@/lib/AuthContext", () => ({
    useAuth: () => authMock,
    AuthContext: {},
}));

import {
    serializeSimulationSamples,
    parseStoredSimulationSamples,
    useExperimentPersistence,
} from "./useExperimentPersistence";
import { calculateFreeFallStep } from "@/components/simulation/engines/freeFallEngine";

describe("useExperimentPersistence sample serialization (T16, T52)", () => {
    it("flattens nested position.y, strips internal keys, and preserves exact final impact point", () => {
        const params = { h0: 20, v0: -5, g: 9.81, m: 2, c: 0.4 };
        const raw = [];
        for (let t = 0; t <= 10; t += 0.001) {
            const pt = calculateFreeFallStep(Number(t.toFixed(6)), params);
            raw.push(pt);
            if (pt.shouldStop) break;
        }

        const serialized = serializeSimulationSamples(raw, 200);
        expect(serialized.length).toBeLessThanOrEqual(200);
        expect(serialized[0].time).toBe(0);
        expect(typeof serialized[0].position).toBe("number");
        expect(serialized[0].position).toBeCloseTo(20, 5);
        expect(serialized[0].velocity).toBeCloseTo(-5, 5);
        expect(serialized[0]).not.toHaveProperty("shouldStop");

        // Final point is the exact impact point
        const last = serialized[serialized.length - 1];
        expect(last.position).toBe(0);
        expect(last.velocity).toBeLessThan(0);

        // Round-trip through JSON in results_url
        const json = JSON.stringify(serialized);
        const parsed = parseStoredSimulationSamples(json);
        expect(parsed).toEqual(serialized);
    });

    it("returns null from parseStoredSimulationSamples for empty or non-JSON strings", () => {
        expect(parseStoredSimulationSamples(null)).toBeNull();
        expect(parseStoredSimulationSamples("")).toBeNull();
        expect(parseStoredSimulationSamples("https://example.com/data.csv")).toBeNull();
    });

    describe("in-app toast notifications (T52)", () => {
        beforeEach(() => {
            vi.clearAllMocks();
            authMock.isAuthenticated = true;
            authMock.user = { locale_preference: "en" };
        });

        it("shows a localized sign-in action toast when a guest attempts to save", async () => {
            authMock.isAuthenticated = false;
            const { saveRun } = useExperimentPersistence({ slug: "free-fall" }, null, {}, [{ time: 0, position: 10 }]);
            await saveRun();
            expect(toastMocks.info).toHaveBeenCalledTimes(1);
            const [message, options] = toastMocks.info.mock.calls[0];
            expect(message).toContain("registered users only");
            expect(options.action.label).toBe("Sign in");
            options.action.onClick();
            expect(authMock.navigateToLogin).toHaveBeenCalledTimes(1);
        });

        it("shows a success toast after saving a run", async () => {
            createRunMock.mockResolvedValueOnce({ id: "run-1" });
            const { saveRun } = useExperimentPersistence({ slug: "free-fall" }, null, { h0: 10 }, [{ time: 0, position: 10 }]);
            await saveRun();
            expect(createRunMock).toHaveBeenCalledTimes(1);
            // parameters_json is a jsonb column (T59): the object is sent as-is, not stringified.
            expect(createRunMock.mock.calls[0][0].parameters_json).toEqual({ h0: 10 });
            expect(toastMocks.success).toHaveBeenCalledWith("Run saved successfully!");
        });
    });
});
