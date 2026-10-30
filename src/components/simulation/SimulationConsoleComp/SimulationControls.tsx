import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { ghostIconButtonClass, plasmaButtonClass, quietButtonClass } from "../workspace/workspaceStyles";
import type { IsRTLProps } from "@/types/props";
import type { SimulationConsoleHandlers } from "@/types/simulation";

type SimulationControlsProps = IsRTLProps &
    Pick<
        SimulationConsoleHandlers,
        | "simulationState"
        | "onStart"
        | "onPause"
        | "onContinue"
        | "onReset"
        | "onStepForward"
        | "onStepBackward"
        | "onScrub"
        | "playbackTime"
        | "simulationData"
    > & {
        maxAvailableTime: number;
        isValid?: boolean;
    };

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
}: SimulationControlsProps) {
    const { t } = useTranslation(isRTL);
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
    const mainButtonClass = "flex-grow h-10 flex items-center justify-center gap-2";

    return (
        <div className="flex flex-col gap-4">
            {/* כפתורי בקרה */}
            <div className="flex items-center justify-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onStepBackward}
                    disabled={disableStep || playbackTime === 0}
                    aria-label={t("workspace.stepBackward")}
                    className={cn("flex-shrink-0", ghostIconButtonClass)}
                >
                    <SkipBack className="w-4 h-4 rtl:-scale-x-100" />
                </Button>

                {isIdle ? (
                    <Button
                        className={cn(mainButtonClass, plasmaButtonClass)}
                        onClick={onStart}
                        disabled={!isValid}
                    >
                        <Play className="w-4 h-4" />
                        {t("workspace.start")}
                    </Button>
                ) : isCalculating ? (
                    <Button className={cn(mainButtonClass, quietButtonClass, "text-blueshift")} disabled>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("workspace.calculating")}
                    </Button>
                ) : isRunning && hasData ? (
                    <Button className={cn(mainButtonClass, quietButtonClass, "text-star")} onClick={onPause}>
                        <Pause className="w-4 h-4" />
                        {t("workspace.pause")}
                    </Button>
                ) : isPaused && hasData ? (
                    <Button className={cn(mainButtonClass, plasmaButtonClass)} onClick={onContinue}>
                        <Play className="w-4 h-4" />
                        {t("workspace.continue")}
                    </Button>
                ) : (
                    <Button className={cn(mainButtonClass, quietButtonClass)} disabled={isCompleted}>
                        {t("workspace.completed")}
                    </Button>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onStepForward}
                    disabled={disableStep || playbackTime >= maxAvailableTime}
                    aria-label={t("workspace.stepForward")}
                    className={cn("flex-shrink-0", ghostIconButtonClass)}
                >
                    <SkipForward className="w-4 h-4 rtl:-scale-x-100" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onReset}
                    disabled={disableReset}
                    aria-label={t("workspace.resetSimulation")}
                    className={cn("flex-shrink-0", ghostIconButtonClass)}
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>
            </div>

            {!isValid && (
                <p className="text-xs text-danger bg-danger/10 border border-danger/30 rounded-md px-2 py-1.5 text-center" role="alert">
                    {t("workspace.fixParameterErrors")}
                </p>
            )}

            {/* בר הזמן - מוצג תמיד, מושבת כשאין נתונים */}
            <Slider
                value={[playbackTime]}
                onValueChange={([value]) => onScrub(value)}
                max={sliderMax}
                step={0.001}
                disabled={!hasData || isCalculating || isRunning}
                className={cn(
                    "w-full",
                    "[&>span:first-child]:bg-line [&>span:first-child>span]:bg-plasma",
                    "[&_[role=slider]]:border-plasma [&_[role=slider]]:bg-plasma-hi [&_[role=slider]]:focus-visible:ring-blueshift"
                )}
            />
        </div>
    );
}
