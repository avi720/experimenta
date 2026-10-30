/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as THREE from "three";
import { I18nContext, type Locale } from "@/i18n";
import type { SimulationDataPoint } from "@/types/simulation";
import QuantumTunnelingScene from "./QuantumTunnelingScene";

vi.mock("@/simulation/sceneUtils", async () => {
    const actual = await vi.importActual<typeof import("@/simulation/sceneUtils")>("@/simulation/sceneUtils");
    return {
        ...actual,
        setupScene: () => ({
            scene: new THREE.Scene(),
            start: () => {},
            dispose: () => {},
        }),
    };
});

beforeAll(() => {
    // Radix popper calls these; jsdom does not implement them.
    if (!Element.prototype.hasPointerCapture) {
        Element.prototype.hasPointerCapture = () => false;
    }
    if (!Element.prototype.setPointerCapture) {
        Element.prototype.setPointerCapture = () => {};
    }
    if (!Element.prototype.releasePointerCapture) {
        Element.prototype.releasePointerCapture = () => {};
    }
    if (!("ResizeObserver" in globalThis)) {
        class ResizeObserverStub {
            observe() {}
            unobserve() {}
            disconnect() {}
        }
        vi.stubGlobal("ResizeObserver", ResizeObserverStub);
    }
});

afterEach(() => {
    cleanup();
    document.documentElement.lang = "";
    document.documentElement.dir = "";
});

function point(partial: SimulationDataPoint): SimulationDataPoint {
    return { time: 1, position: 30, transmission: 0.4, reflection: 0.6, ...partial };
}

function renderScene(locale: Locale, dataPointToRender: SimulationDataPoint | null) {
    const dir = locale === "he" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    return render(
        <I18nContext.Provider value={{ locale, isRTL: locale === "he", dir }}>
            <QuantumTunnelingScene dataPointToRender={dataPointToRender} />
        </I18nContext.Provider>
    );
}

function statusDot(container: HTMLElement) {
    const dot = container.querySelector("span[aria-hidden='true']");
    if (!dot) throw new Error("status dot not found");
    return dot;
}

describe("QuantumTunnelingScene measurement badge", () => {
    it("shows the waiting state until a collapse result exists", () => {
        const { rerender, container } = renderScene("he", null);
        expect(screen.getByText("הגלאי ממתין למדידה")).toBeTruthy();
        expect(statusDot(container).className).toContain("bg-dust");

        rerender(
            <I18nContext.Provider value={{ locale: "he", isRTL: true, dir: "rtl" }}>
                <QuantumTunnelingScene
                    dataPointToRender={point({ hasCollapsed: false, measurementResult: "transmitted" })}
                />
            </I18nContext.Provider>
        );
        expect(screen.getByText("הגלאי ממתין למדידה")).toBeTruthy();

        rerender(
            <I18nContext.Provider value={{ locale: "he", isRTL: true, dir: "rtl" }}>
                <QuantumTunnelingScene dataPointToRender={point({ hasCollapsed: true })} />
            </I18nContext.Provider>
        );
        expect(screen.getByText("הגלאי ממתין למדידה")).toBeTruthy();
    });

    it("shows transmitted and reflected states, and returns to waiting when scrubbed back", () => {
        const { rerender, container } = renderScene(
            "en",
            point({ hasCollapsed: true, measurementResult: "transmitted" })
        );
        expect(screen.getByText("Measured: particle passed")).toBeTruthy();
        expect(statusDot(container).className).toContain("bg-success");

        rerender(
            <I18nContext.Provider value={{ locale: "en", isRTL: false, dir: "ltr" }}>
                <QuantumTunnelingScene
                    dataPointToRender={point({ hasCollapsed: true, measurementResult: "reflected" })}
                />
            </I18nContext.Provider>
        );
        expect(screen.getByText("Measured: particle reflected")).toBeTruthy();
        expect(statusDot(container).className).toContain("bg-plasma");

        rerender(
            <I18nContext.Provider value={{ locale: "en", isRTL: false, dir: "ltr" }}>
                <QuantumTunnelingScene
                    dataPointToRender={point({
                        position: 10,
                        hasCollapsed: false,
                        measurementResult: "reflected",
                    })}
                />
            </I18nContext.Provider>
        );
        expect(screen.getByText("Detector waiting for measurement")).toBeTruthy();
        expect(statusDot(container).className).toContain("bg-dust");
    });

    it("keeps the badge outside the WebGL mount and uses logical positioning", () => {
        const { container } = renderScene("he", null);
        const mount = container.querySelector("div.relative > div.w-full.h-full");
        const button = screen.getByRole("button", { name: "הסבר על קריסת פונקציית הגל" });
        expect(mount?.contains(button)).toBe(false);
        expect(container.querySelector(".absolute.top-3.start-3")).toBeTruthy();
        expect(container.innerHTML).not.toMatch(/\b(ml-|mr-|pl-|pr-|text-left|text-right|left-|right-)/);
    });
});

describe("QuantumTunnelingScene collapse popover", () => {
    it("opens from a translated trigger, toggles aria-expanded, and closes on Escape", async () => {
        const user = userEvent.setup();
        renderScene("he", point({ hasCollapsed: true, measurementResult: "transmitted" }));

        const trigger = screen.getByRole("button", { name: "הסבר על קריסת פונקציית הגל" });
        expect(trigger.getAttribute("aria-expanded")).toBe("false");
        expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
        expect(screen.queryByRole("dialog")).toBeNull();

        await user.click(trigger);

        const dialog = screen.getByRole("dialog");
        expect(trigger.getAttribute("aria-expanded")).toBe("true");
        expect(dialog.getAttribute("aria-labelledby")).toBe("quantum-collapse-title");
        expect(dialog.getAttribute("dir")).toBe("rtl");
        expect(screen.getByRole("heading", { name: "מה זו קריסת פונקציית הגל?" })).toBeTruthy();
        expect(dialog.textContent).toContain("פונקציית הגל \"קורסת\"");
        expect(dialog.className).toContain("text-start");
        expect(dialog.className).toContain("w-80");

        await user.keyboard("{Escape}");

        expect(screen.queryByRole("dialog")).toBeNull();
        expect(trigger.getAttribute("aria-expanded")).toBe("false");
        expect(document.activeElement).toBe(trigger);
    });

    it("shows the English explanation from the English trigger label", async () => {
        const user = userEvent.setup();
        renderScene("en", null);

        const trigger = screen.getByRole("button", { name: "Explain wave-function collapse" });
        await user.click(trigger);

        const dialog = screen.getByRole("dialog");
        expect(dialog.getAttribute("dir")).toBe("ltr");
        expect(screen.getByRole("heading", { name: "What is wave-function collapse?" })).toBeTruthy();
        expect(dialog.textContent).toContain("the wave function \"collapses\"");
        expect(screen.getByText("Detector waiting for measurement")).toBeTruthy();
    });
});
