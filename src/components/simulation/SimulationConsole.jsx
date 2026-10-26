import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "@/i18n";
import SimulationControls from "./SimulationConsoleComp/SimulationControls";
import SimulationTimeDisplay from "./SimulationConsoleComp/SimulationTimeDisplay";
import CurrentValuesDisplay from "./SimulationConsoleComp/CurrentValuesDisplay";

function findClosestDataPoint(simulationData, targetTime) {
    if (!Array.isArray(simulationData) || simulationData.length === 0) {
        return null;
    }
    if (typeof targetTime !== "number" || Number.isNaN(targetTime)) {
        return simulationData[0];
    }
    let closest = simulationData[0];
    let minDiff = Math.abs((closest?.time ?? 0) - targetTime);
    for (let i = 1; i < simulationData.length; i++) {
        const diff = Math.abs((simulationData[i]?.time ?? 0) - targetTime);
        if (diff < minDiff) {
            minDiff = diff;
            closest = simulationData[i];
        } else if (diff > minDiff) {
            break;
        }
    }
    return closest;
}

export default function SimulationConsole({
    simulationState,
    onStart,
    onPause,
    onContinue,
    onReset,
    onStepForward,
    onStepBackward,
    onScrub,
    currentTime,
    playbackTime,
    displayedDataPoint,
    simulationData = [],
    experiment,
    isRTL,
    onFloat,
    validationState
}) {
    const { t } = useTranslation(isRTL);

    // חישוב הזמן המקסימלי שחושב בפועל
    const maxAvailableTime = simulationData && simulationData.length > 0
        ? simulationData[simulationData.length - 1].time ?? 0
        : 0;

    // נקודת הנתונים הנוכחית להצגה
    const currentDataPoint =
        displayedDataPoint || findClosestDataPoint(simulationData, playbackTime ?? currentTime);

    const isValid = validationState?.isAllValid !== false;

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                    {t("workspace.simulationConsoleTitle")}
                </h3>
                {onFloat && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onFloat}
                        aria-label={t("workspace.floatSimulationConsole")}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {/* פקדי סימולציה */}
                <SimulationControls
                    simulationState={simulationState}
                    onStart={onStart}
                    onPause={onPause}
                    onContinue={onContinue}
                    onReset={onReset}
                    onStepForward={onStepForward}
                    onStepBackward={onStepBackward}
                    onScrub={onScrub}
                    playbackTime={playbackTime}
                    maxAvailableTime={maxAvailableTime}
                    simulationData={simulationData}
                    isRTL={isRTL}
                    isValid={isValid}
                />

                {/* תצוגת זמן */}
                <SimulationTimeDisplay
                    playbackTime={playbackTime}
                    maxAvailableTime={maxAvailableTime}
                    isRTL={isRTL}
                />

                {/* תצוגת ערכים נוכחיים */}
                <CurrentValuesDisplay
                    displayedDataPoint={currentDataPoint}
                    dataPoint={currentDataPoint}
                    experiment={experiment}
                    isRTL={isRTL}
                />
            </div>
        </Card>
    );
}
