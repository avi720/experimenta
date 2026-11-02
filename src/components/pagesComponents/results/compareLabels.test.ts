import { describe, expect, it } from "vitest";
import type { Locale } from "@/i18n";
import { EXPERIMENT_GUIDES } from "@/simulation/guides";
import {
  parametersFromTemplate,
  resolveParameterLabel,
  resolveSeriesLabel,
} from "./compareLabels";

const LOCALES: readonly Locale[] = ["he", "en"];

/** Labels copied from the template rows the lab ships. Admins can edit these in the catalogue. */
const CATALOGUES = {
  "free-fall": [
    { key: "h0", unit: "m", i18n_labels: { he: "גובה התחלתי", en: "Initial height" } },
    { key: "g", unit: "m/s²", i18n_labels: { he: "תאוצת כובד", en: "Gravity" } },
  ],
  sho: [
    { key: "k", unit: "N/m", i18n_labels: { he: "קבוע קפיץ", en: "Spring constant" } },
  ],
  "double-slit": [
    { key: "wavelength", unit: "nm", i18n_labels: { he: "אורך גל", en: "Wavelength" } },
  ],
  "quantum-tunneling": [
    { key: "V0", unit: "eV", i18n_labels: { he: "גובה המחסום", en: "Barrier height" } },
  ],
} as const;

describe("resolveSeriesLabel", () => {
  it("uses each experiment's guide label, symbol, and unit in Hebrew and English", () => {
    for (const [slug, guide] of Object.entries(EXPERIMENT_GUIDES)) {
      expect(guide, slug).toBeTruthy();
      for (const quantity of guide!.quantities) {
        for (const locale of LOCALES) {
          const label = resolveSeriesLabel(slug, quantity.key, locale);
          const expected = [quantity.label[locale], quantity.symbol, quantity.unit ? `[${quantity.unit}]` : ""]
            .filter((part) => part.length > 0)
            .join(" ");
          expect(label.name, `${slug}.${quantity.key}.${locale}`).toBe(quantity.label[locale]);
          expect(label.text, `${slug}.${quantity.key}.${locale}`).toBe(expected);
          expect(label.name).not.toBe(quantity.key);
        }
      }
    }
  });

  it("names free-fall axes the way the live charts do, and the spring differently", () => {
    expect(resolveSeriesLabel("free-fall", "time", "he").text).toBe("זמן t [s]");
    expect(resolveSeriesLabel("free-fall", "position", "he").text).toBe("גובה y [m]");
    expect(resolveSeriesLabel("free-fall", "time", "en").text).toBe("Time t [s]");
    expect(resolveSeriesLabel("free-fall", "position", "en").text).toBe("Height y [m]");
    expect(resolveSeriesLabel("sho", "position", "he").name).toBe("מיקום");
    expect(resolveSeriesLabel("sho", "position", "en").name).toBe("Position");
    expect(resolveSeriesLabel("double-slit", "intensity", "he").text).toBe("עוצמה יחסית I");
    expect(resolveSeriesLabel("quantum-tunneling", "transmission", "en").name).toBe("Transmission coefficient");
  });

  it("keeps a key the guide does not list", () => {
    expect(resolveSeriesLabel("free-fall", "position_y", "he").text).toBe("position_y");
    expect(resolveSeriesLabel("custom-lab", "time", "en").text).toBe("time");
  });
});

describe("resolveParameterLabel", () => {
  it("uses the template label and unit for every shipped experiment, in Hebrew and English", () => {
    expect(resolveParameterLabel("h0", CATALOGUES["free-fall"], "he").text).toBe("גובה התחלתי (m)");
    expect(resolveParameterLabel("h0", CATALOGUES["free-fall"], "en").text).toBe("Initial height (m)");
    expect(resolveParameterLabel("g", CATALOGUES["free-fall"], "he").name).toBe("תאוצת כובד");
    expect(resolveParameterLabel("k", CATALOGUES.sho, "en").text).toBe("Spring constant (N/m)");
    expect(resolveParameterLabel("k", CATALOGUES.sho, "he").text).toBe("קבוע קפיץ (N/m)");
    expect(resolveParameterLabel("wavelength", CATALOGUES["double-slit"], "he").text).toBe("אורך גל (nm)");
    expect(resolveParameterLabel("wavelength", CATALOGUES["double-slit"], "en").text).toBe("Wavelength (nm)");
    expect(resolveParameterLabel("V0", CATALOGUES["quantum-tunneling"], "he").text).toBe("גובה המחסום (eV)");
    expect(resolveParameterLabel("V0", CATALOGUES["quantum-tunneling"], "en").text).toBe("Barrier height (eV)");
  });

  it("falls back to the stored key when the template has no label", () => {
    expect(resolveParameterLabel("h0", [], "he").text).toBe("h0");
    expect(resolveParameterLabel("flag", [{ key: "flag", i18n_labels: { he: "דגל", en: "Flag" } }], "en").text).toBe("Flag");
    expect(
      resolveParameterLabel("h0", [{ key: "h0", unit: "m", i18n_labels: { he: "", en: "" } }], "en").text,
    ).toBe("h0 (m)");
  });
});

describe("parametersFromTemplate", () => {
  it("reads the parameters of the run's experiment and ignores a bad payload", () => {
    const templates = [
      { slug: "sho", parameters: [{ key: "k", unit: "N/m" }] },
      { slug: "free-fall", parameters: CATALOGUES["free-fall"] },
      { slug: "broken", parameters: "not-an-array" },
    ];
    expect(parametersFromTemplate(templates, "free-fall").map((item) => item.key)).toEqual(["h0", "g"]);
    expect(parametersFromTemplate(templates, "broken")).toEqual([]);
    expect(parametersFromTemplate(templates, null)).toEqual([]);
    expect(parametersFromTemplate(undefined, "free-fall")).toEqual([]);
  });
});
