import type { Locale } from "@/i18n";
import { pickLocalized } from "@/i18n";
import { getExperimentGuide } from "@/simulation/guides";
import type { Parameter } from "@/types/experiment";

/**
 * Names shown on the Compare tab.
 *
 * A series uses the experiment guide: the same localized label, symbol, and unit as the live
 * charts. A parameter uses the template (`i18n_labels` and `unit`): the same text as the
 * experiment controls. The words differ per experiment — free-fall `position` is height, the
 * spring's `position` is displacement — so they are not a single dictionary entry. A key the
 * guide or the template does not know stays as it was stored.
 */

export type ResolvedLabel = {
  key: string;
  /** Localized words, for example "זמן" or "Time". */
  name: string;
  symbol: string;
  unit: string;
  /** Charts write `[m]`; the parameter controls write `(m)`. */
  unitAffix: "bracket" | "paren" | "none";
  /** One string for an svg title, a tooltip, or an aria label. */
  text: string;
};

function unknownLabel(key: string): ResolvedLabel {
  return { key, name: key, symbol: "", unit: "", unitAffix: "none", text: key };
}

function joinParts(parts: readonly string[]): string {
  return parts.filter((part) => part.length > 0).join(" ");
}

export function resolveSeriesLabel(
  slug: string | null | undefined,
  key: string,
  locale: Locale,
): ResolvedLabel {
  const quantity = getExperimentGuide(slug)?.quantities.find((item) => item.key === key);
  if (!quantity) return unknownLabel(key);
  const name = pickLocalized(quantity.label, locale, key);
  const unit = quantity.unit;
  const symbol = quantity.symbol;
  return {
    key,
    name,
    symbol,
    unit,
    unitAffix: unit ? "bracket" : "none",
    text: joinParts([name, symbol, unit ? `[${unit}]` : ""]),
  };
}

export function resolveParameterLabel(
  key: string,
  parameters: readonly Pick<Parameter, "key" | "unit" | "i18n_labels">[] | null | undefined,
  locale: Locale,
): ResolvedLabel {
  const parameter = parameters?.find((item) => item.key === key);
  if (!parameter) return unknownLabel(key);
  const name = pickLocalized(parameter.i18n_labels, locale, key);
  const unit = typeof parameter.unit === "string" ? parameter.unit : "";
  return {
    key,
    name,
    symbol: "",
    unit,
    unitAffix: unit ? "paren" : "none",
    text: unit ? `${name} (${unit})` : name,
  };
}

function isParameter(value: unknown): value is Parameter {
  return Boolean(value) && typeof value === "object" && typeof (value as Parameter).key === "string";
}

/** Parameter definitions for one experiment, or none when the template has not loaded. */
export function parametersFromTemplate(
  templates: readonly { slug?: string | null; parameters?: unknown }[] | null | undefined,
  slug: string | null | undefined,
): Parameter[] {
  if (!slug || !templates) return [];
  const row = templates.find((item) => item.slug === slug);
  if (!Array.isArray(row?.parameters)) return [];
  return row.parameters.filter(isParameter);
}
