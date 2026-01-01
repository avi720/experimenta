import React from "react";
import FloatingWindow from "../FloatingWindow";
import SimulationConsole from "../SimulationConsole";
import SimulationCharts from "../charts/SimulationCharts";

export default function FloatingWindowsManager({
    experiment,
    isRTL,
    floatingWindows,
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
    maxSimulationTime,
    onToggleConsole,
    onToggleCharts
}) {
    return (
        <>
            {floatingWindows.console && (
                <FloatingWindow
                    title={isRTL ? "קונסולת סימולציה" : "Simulation Console"}
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
                        simulationData={simulationData}
                        experiment={experiment}
                        isRTL={isRTL}
                        maxSimulationTime={maxSimulationTime}
                    />
                </FloatingWindow>
            )}

            {floatingWindows.charts && (
                <FloatingWindow
                    title={isRTL ? "גרפים" : "Charts"}
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