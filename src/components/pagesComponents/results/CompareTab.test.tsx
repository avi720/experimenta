/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nContext, translate, type Locale } from "@/i18n";
import type { ExperimentRun } from "@/types/models";
import type { ParamState, Sample } from "@/types/results";
import { formatRunDate } from "./resultsDomain";
import CompareTab from "./CompareTab";

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
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

const shortSamples: Sample[] = [
  { time: 0, position: 10, velocity: 0 },
  { time: 0.5, position: 8, velocity: -2 },
  { time: 1, position: 5, velocity: -5 },
];

const longSamples: Sample[] = [
  { time: 0, position: 20, velocity: 0 },
  { time: 1, position: 12, velocity: -8 },
  { time: 5, position: 0, velocity: -12 },
];

function makeRun(overrides: Partial<ExperimentRun> & Pick<ExperimentRun, "id">): ExperimentRun {
  return {
    experiment_slug: "free-fall",
    created_by: "user-1",
    created_date: "2026-10-20T08:00:00.000Z",
    updated_date: "2026-10-20T08:00:00.000Z",
    notes: "",
    parameters_json: { h0: 10, g: 9.81 },
    results_url: null,
    samples_count: 0,
    challenge: null,
    ...overrides,
  };
}

const current = makeRun({
  id: "run-short",
  created_date: "2026-10-20T08:00:00.000Z",
  parameters_json: { h0: 10, g: 9.81 },
  results_url: JSON.stringify(shortSamples),
  samples_count: shortSamples.length,
});

const partner = makeRun({
  id: "run-long",
  created_date: "2026-10-21T09:30:00.000Z",
  parameters_json: { h0: 20, g: 9.81 },
  results_url: JSON.stringify(longSamples),
  samples_count: longSamples.length,
});

const otherExperiment = makeRun({
  id: "run-sho",
  experiment_slug: "sho",
  created_date: "2026-10-22T11:00:00.000Z",
  parameters_json: { k: 10, m: 1 },
  results_url: JSON.stringify([{ time: 0, position: 1 }]),
  samples_count: 1,
});

const paramState: ParamState = { parameters: { h0: 10, g: 9.81 }, error: null };

function labelFor(run: ExperimentRun): string {
  return formatRunDate(run.created_date, "dd/MM/yyyy HH:mm");
}

function renderCompare(locale: Locale, runs: ExperimentRun[]) {
  const dir = locale === "he" ? "rtl" : "ltr";
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
  return render(
    <I18nContext.Provider value={{ locale, isRTL: locale === "he", dir }}>
      <CompareTab run={current} samples={shortSamples} paramState={paramState} runs={runs} />
    </I18nContext.Provider>,
  );
}

describe("CompareTab selection", () => {
  it("stays disabled when the only other run is a different experiment", () => {
    renderCompare("en", [current, otherExperiment]);

    const picker = screen.getByRole("combobox", { name: "Compare with" });
    expect((picker as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(translate("en", "results.compareNeedAnotherRun"))).toBeTruthy();
    expect(screen.queryByRole("option", { name: labelFor(otherExperiment) })).toBeNull();
  });

  it("overlays the chosen run and shows only the parameters that differ", async () => {
    const user = userEvent.setup();
    renderCompare("en", [current, partner, otherExperiment]);

    await user.click(screen.getByRole("combobox", { name: "Compare with" }));

    expect(screen.getByRole("option", { name: labelFor(partner) })).toBeTruthy();
    expect(screen.queryByRole("option", { name: labelFor(otherExperiment) })).toBeNull();

    await user.click(screen.getByRole("option", { name: labelFor(partner) }));

    const chart = screen.getByRole("img");
    expect(chart.getAttribute("dir")).toBe("ltr");
    expect(chart.getAttribute("aria-label")).toContain("position against time");
    expect(chart.getAttribute("aria-label")).toContain(labelFor(current));
    expect(chart.getAttribute("aria-label")).toContain(labelFor(partner));

    expect(screen.getByText("h0")).toBeTruthy();
    expect(screen.getByText("10.000")).toBeTruthy();
    expect(screen.getByText("20.000")).toBeTruthy();
    expect(screen.queryByText("g")).toBeNull();
    expect(screen.getByText(translate("en", "results.compareOtherParametersMatch"))).toBeTruthy();
    expect(screen.getByText("time 0.000–1.000")).toBeTruthy();
    expect(screen.getByText("time 0.000–5.000")).toBeTruthy();
  });

  it("keeps the page direction RTL and the chart left to right in Hebrew", async () => {
    const user = userEvent.setup();
    const { container } = renderCompare("he", [current, partner]);

    expect(container.firstElementChild?.getAttribute("dir")).toBe("rtl");
    expect(screen.getByText(translate("he", "results.comparePickSecondRun"))).toBeTruthy();

    await user.click(screen.getByRole("combobox", { name: "השוואה לריצה" }));
    await user.click(screen.getByRole("option", { name: labelFor(partner) }));

    expect(screen.getByRole("heading", { name: "מה השתנה" })).toBeTruthy();
    expect(screen.getByRole("img").getAttribute("dir")).toBe("ltr");
    expect(screen.getByText("h0")).toBeTruthy();
    expect(screen.getByText("20.000")).toBeTruthy();
  });
});
