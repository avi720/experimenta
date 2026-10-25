import React from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Loader2 } from "lucide-react";

export default function SimulationControls({
    simulationState,
    onStart,
    onPause,
    onContinue,
    onReset,
    onStepForward,
    onStepBackward,
    onScrub,
    playbackTime,
    maxAvailableTime,
    simulationData,
    isRTL,
    isValid = true
}) {
    const hasData = simulationData && simulationData.length > 0 && maxAvailableTime > 0;
    const isIdle = simulationState === 'idle';
    const isRunning = simulationState === 'running';
    const isPaused = simulationState === 'paused';
    const isCompleted = simulationState === 'completed';
    const isCalculating = simulationState === 'calculating';

    // כפתורי step מושבתים כשאין נתונים או בזמן חישוב/ריצה; כפתור reset זמין גם בזמן חישוב/ריצה (T23)
    const disableStep = !hasData || isCalculating || isRunning;
    const disableReset = isIdle && !hasData;
    const sliderMax = hasData ? maxAvailableTime : 0;

    return (
        <div className="flex flex-col gap-4">
            {/* כפתורי בקרה */}
            <div className="flex items-center justify-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onStepBackward}
                    disabled={disableStep || playbackTime === 0}
                    aria-label={isRTL ? "צעד אחורה" : "Step backward"}
                    className="flex-shrink-0"
                >
                    <SkipBack className="w-4 h-4" />
                </Button>

                {isIdle ? (
                    <Button
                        className="flex-grow flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                        onClick={onStart}
                        disabled={!isValid}
                    >
                        <Play className="w-4 h-4" />
                        {isRTL ? "התחל" : "Start"}
                    </Button>
                ) : isCalculating ? (
                    <Button className="flex-grow flex items-center justify-center gap-2 bg-blue-600 text-white" disabled>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isRTL ? "מחשב..." : "Calculating..."}
                    </Button>
                ) : isRunning && hasData ? (
                    <Button className="flex-grow flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white" onClick={onPause}>
                        <Pause className="w-4 h-4" />
                        {isRTL ? "השהה" : "Pause"}
                    </Button>
                ) : isPaused && hasData ? (
                    <Button className="flex-grow flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={onContinue}>
                        <Play className="w-4 h-4" />
                        {isRTL ? "המשך" : "Continue"}
                    </Button>
                ) : (
                    <Button className="flex-grow flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white" disabled={isCompleted}>
                        {isRTL ? "הושלם" : "completed"}
                    </Button>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onStepForward}
                    disabled={disableStep || playbackTime >= maxAvailableTime}
                    aria-label={isRTL ? "צעד קדימה" : "Step forward"}
                    className="flex-shrink-0"
                >
                    <SkipForward className="w-4 h-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onReset}
                    disabled={disableReset}
                    aria-label={isRTL ? "אפס סימולציה" : "Reset simulation"}
                    className="flex-shrink-0"
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>
            </div>

            {!isValid && (
                <p className="text-xs text-red-500 text-center" role="alert">
                    {isRTL
                        ? "יש לתקן את ערכי הפרמטרים לפני הפעלת הסימולציה"
                        : "Please fix parameter errors before starting the simulation"}
                </p>
            )}

            {/* בר הזמן - מוצג תמיד, מושבת כשאין נתונים */}
            <Slider
                value={[playbackTime]}
                onValueChange={([value]) => onScrub(value)}
                max={sliderMax}
                step={0.001}
                disabled={!hasData || isCalculating || isRunning}
                className="w-full"
            />
        </div>
    );
}
