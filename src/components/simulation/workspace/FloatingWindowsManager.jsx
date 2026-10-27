import React from "react";
import { useTranslation } from "@/i18n";
import FloatingWindow from "../FloatingWindow";
import SimulationConsole from "../SimulationConsole";
import SimulationCharts from "../charts/SimulationCharts";

export default function FloatingWindowsManager({
    experiment,
    isRTL,
    floatingWindows = {},
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
    simulationData,
    maxSimulationTime,
    validationState,
    onToggleConsole,
    onToggleCharts
}) {
    const { t } = useTranslation(isRTL);

    return (
        <>
            {floatingWindows?.console && (
                <FloatingWindow
                    title={t("workspace.simulationConsoleTitle")}
                    defaultPosition={{ x: 20, y: 100 }}
                    defaultSize={{ width: 400, height: 500 }}
                    onClose={onToggleConsole}
                    isRTL={isRTL}
                >
                    <SimulationConsole
                        simulationState={simulationState}
                        onStart={onStart}
                        onPause={onPause}
                        onContinue={onContinue}
                        onReset={onReset}
                        onStepForward={onStepForward}
                        onStepBackward={onStepBackward}
                        onScrub={onScrub}
                        currentTime={currentTime}
                        playbackTime={playbackTime}
                        displayedDataPoint={displayedDataPoint}
                        simulationData={simulationData}
                        experiment={experiment}
                        isRTL={isRTL}
                        validationState={validationState}
                    />
                </FloatingWindow>
            )}

            {floatingWindows?.charts && (
                <FloatingWindow
                    title={t("workspace.chartsWindowTitle")}
                    defaultPosition={{ x: 440, y: 100 }}
                    defaultSize={{ width: 600, height: 500 }}
                    onClose={onToggleCharts}
                    isRTL={isRTL}
                >
                    <SimulationCharts
                        simulationData={simulationData}
                        experiment={experiment}
                        isRTL={isRTL}
                    />
                </FloatingWindow>
            )}
        </>
    );
}
