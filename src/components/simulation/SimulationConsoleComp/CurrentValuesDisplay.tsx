import { Activity, Lock } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { ExperimentGuide } from "@/simulation/guides";
import type { IsRTLProps } from "@/types/props";
import type { SimulationDataPoint } from "@/types/simulation";

type CurrentValuesDisplayProps = IsRTLProps & {
    displayedDataPoint?: SimulationDataPoint | null;
    dataPoint?: SimulationDataPoint | null;
    guide?: ExperimentGuide | null;
    /** Quantities hidden while they would give away the unknown. */
    hiddenKeys?: ReadonlyArray<string>;
};

type Readout = { key: string; label: string; unit: string; value: unknown; hidden: boolean };

function formatMetricValue(value: unknown): string {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value.toFixed(4) : String(value);
    }
    if (value && typeof value === "object") {
        if ("y" in value && typeof value.y === "number") {
            return value.y.toFixed(4);
        }
        return JSON.stringify(value);
    }
    return String(value ?? "");
}

/**
 * תצוגת ערכים נוכחיים מהסימולציה
 */
export default function CurrentValuesDisplay({
    displayedDataPoint,
    dataPoint,
    guide = null,
    hiddenKeys = [],
    isRTL
}: CurrentValuesDisplayProps) {
    const { t, pick } = useTranslation(isRTL);
    const point = displayedDataPoint || dataPoint;

    if (!point || typeof point !== "object") {
        return (
            <div className="border border-dashed border-line rounded-md p-4">
                <div className="flex items-center justify-center text-dust gap-2">
                    <Activity className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm">
                        {t("workspace.noDataToDisplay")}
                    </span>
                </div>
            </div>
        );
    }

    // With a guide: its quantities, named and with units. Without one: every raw key, as before.
    const readouts: Readout[] = guide
        ? guide.quantities
              .filter((q) => q.key in point && q.key !== "time")
              .map((q) => ({
                  key: q.key,
                  label: `${pick(q.label)} ${q.symbol}`,
                  unit: q.unit,
                  value: point[q.key],
                  hidden: hiddenKeys.includes(q.key),
              }))
        : Object.entries(point)
              .filter(
                  ([key, value]) =>
                      key !== "shouldStop" &&
                      key !== "debug" &&
                      key !== "pattern" &&
                      key !== "parameters" &&
                      typeof value !== "function"
              )
              .map(([key, value]) => ({ key, label: key.replace(/_/g, " "), unit: "", value, hidden: false }));

    return (
        <section>
            <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-blueshift" aria-hidden="true" />
                <h3 className="text-[13px] font-medium text-dust">
                    {t("workspace.currentValuesTitle")}
                </h3>
            </div>
            {/* A grid of readouts split by hairlines: gap-px over a line-coloured backing. */}
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
                {readouts.map(({ key, label, unit, value, hidden }) => (
                    <div key={key} className="bg-space/90 px-3 py-2 min-w-0">
                        <div className="text-xs text-dust mb-1 truncate" dir={guide ? undefined : "ltr"} title={label}>
                            {label}
                        </div>
                        {hidden ? (
                            <div className="flex items-center gap-1 text-sm text-horizon">
                                <Lock className="w-3 h-3" aria-hidden="true" />
                                {t("workspace.challenge.hiddenValue")}
                            </div>
                        ) : (
                            <div className="text-sm font-mono tabular-nums text-star truncate" dir="ltr">
                                {formatMetricValue(value)}
                                {unit && <span className="ms-1 text-xs text-dust">{unit}</span>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
