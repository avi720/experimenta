import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { useTranslation } from "@/i18n";

function formatMetricValue(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value.toFixed(4) : String(value);
    }
    if (value && typeof value === "object") {
        if (typeof value.y === "number") {
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
    isRTL
}) {
    const { t } = useTranslation(isRTL);
    const point = displayedDataPoint || dataPoint;

    if (!point || typeof point !== "object") {
        return (
            <Card className="bg-slate-50">
                <CardContent className="p-4">
                    <div className="flex items-center justify-center text-slate-400 gap-2">
                        <Activity className="w-5 h-5" />
                        <span className="text-sm">
                            {t("workspace.noDataToDisplay")}
                        </span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const visibleEntries = Object.entries(point).filter(
        ([key, value]) =>
            key !== "shouldStop" &&
            key !== "debug" &&
            key !== "pattern" &&
            key !== "parameters" &&
            typeof value !== "function"
    );

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-800">
                        {t("workspace.currentValuesTitle")}
                    </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {visibleEntries.map(([key, value]) => (
                        <div key={key} className="bg-white/70 rounded-lg p-2">
                            <div className="text-xs text-slate-600 mb-1">
                                {key.replace(/_/g, " ")}
                            </div>
                            <div className="text-sm font-mono font-semibold text-slate-900">
                                {formatMetricValue(value)}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
