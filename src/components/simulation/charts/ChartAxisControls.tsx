import { Lock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/i18n";
import type { ChartView, Quantity } from "@/simulation/guides";
import type { IsRTLProps } from "@/types/props";
import { toggleChipClass } from "../workspace/workspaceStyles";
import type { AxisSelection } from "./chartAxes";

type ChartAxisControlsProps = IsRTLProps & {
    quantities: Quantity[];
    colors: Record<string, string>;
    hiddenKeys: ReadonlyArray<string>;
    views: ChartView[];
    selection: AxisSelection;
    onChange: (selection: AxisSelection) => void;
};

const labelClass = "text-xs text-dust";

/** X-axis picker, Y-series toggles and ready-made views above the live charts. */
export default function ChartAxisControls({
    quantities,
    colors,
    hiddenKeys,
    views,
    selection,
    onChange,
    isRTL,
}: ChartAxisControlsProps) {
    const { t, pick } = useTranslation(isRTL);
    const isHidden = (key: string) => hiddenKeys.includes(key);
    const has = (key: string) => quantities.some((q) => q.key === key);

    const toggleY = (key: string) => {
        const isOn = selection.y.includes(key);
        // Keep at least one series on the chart.
        if (isOn && selection.y.length === 1) return;
        onChange({ x: selection.x, y: isOn ? selection.y.filter((k) => k !== key) : [...selection.y, key] });
    };

    const usableViews = views.filter((view) => has(view.x) && view.y.some(has));

    return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-2">
                <span className={labelClass} id="chart-x-label">{t("workspace.charts.xAxis")}</span>
                <Select value={selection.x} onValueChange={(x) => onChange({ x, y: selection.y.filter((k) => k !== x) })}>
                    <SelectTrigger
                        aria-labelledby="chart-x-label"
                        className="h-8 w-auto min-w-[9rem] gap-2 border-line bg-space/60 text-[13px] text-star hover:border-blueshift/60 focus:ring-blueshift"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-space-raised border-line">
                        {quantities.map((q) => (
                            <SelectItem key={q.key} value={q.key} disabled={isHidden(q.key)}>
                                {pick(q.label)} {q.symbol}
                                {isHidden(q.key) && ` · ${t("workspace.challenge.hiddenValue")}`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("workspace.charts.yAxis")}>
                <span className={`${labelClass} me-1`}>{t("workspace.charts.yAxis")}</span>
                {quantities.filter((q) => q.key !== "time").map((q) => {
                    const hidden = isHidden(q.key);
                    const onX = q.key === selection.x;
                    return (
                        <button
                            key={q.key}
                            type="button"
                            className={toggleChipClass}
                            aria-pressed={selection.y.includes(q.key)}
                            disabled={hidden || onX}
                            title={hidden ? t("workspace.charts.hiddenOption") : onX ? t("workspace.charts.onXAxis") : undefined}
                            onClick={() => toggleY(q.key)}
                        >
                            {hidden ? (
                                <Lock className="h-3 w-3" aria-hidden="true" />
                            ) : (
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors[q.key] }} aria-hidden="true" />
                            )}
                            {pick(q.label)}
                            <span className="font-mono italic" dir="ltr">{q.symbol}</span>
                        </button>
                    );
                })}
            </div>

            {usableViews.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("workspace.charts.views")}>
                    <span className={`${labelClass} me-1`}>{t("workspace.charts.views")}</span>
                    {usableViews.map((view) => {
                        const blocked = isHidden(view.x) || view.y.every(isHidden);
                        const isActive =
                            view.x === selection.x &&
                            view.y.filter(has).length === selection.y.length &&
                            view.y.filter(has).every((k) => selection.y.includes(k));
                        return (
                            <button
                                key={pick(view.name)}
                                type="button"
                                className={toggleChipClass}
                                aria-pressed={isActive}
                                disabled={blocked}
                                onClick={() => onChange({ x: view.x, y: view.y.filter((k) => has(k) && !isHidden(k)) })}
                            >
                                {pick(view.name)}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
