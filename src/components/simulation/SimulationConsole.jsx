import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import SimulationControls from "./SimulationConsoleComp/SimulationControls";
import SimulationTimeDisplay from "./SimulationConsoleComp/SimulationTimeDisplay";
import CurrentValuesDisplay from "./SimulationConsoleComp/CurrentValuesDisplay";

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
    simulationData,
    experiment,
    isRTL,
    onFloat,
    maxSimulationTime
}) {
    // חישוב הזמן המקסימלי שחושב בפועל
    const maxAvailableTime = simulationData && simulationData.length > 0 
        ? simulationData[simulationData.length - 1].time 
        : 0;

    // נקודת הנתונים הנוכחית להצגה
    const currentDataPoint = simulationData.find(d => 
        Math.abs(d.time - playbackTime) < 0.0001
    ) || (simulationData.length > 0 ? simulationData[0] : null);

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                    {isRTL ? "קונסולת סימולציה" : "Simulation Console"}
                </h3>
                {onFloat && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onFloat}
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
                />

                {/* תצוגת זמן */}
                <SimulationTimeDisplay
                    playbackTime={playbackTime}
                    maxAvailableTime={maxAvailableTime}
                    isRTL={isRTL}
                />

                {/* תצוגת ערכים נוכחיים */}
                {currentDataPoint && (
                    <CurrentValuesDisplay
                        dataPoint={currentDataPoint}
                        experiment={experiment}
                        isRTL={isRTL}
                    />
                )}
            </div>
        </Card>
    );
}