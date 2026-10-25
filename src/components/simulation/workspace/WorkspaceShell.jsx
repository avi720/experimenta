import React, { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import ExperimentHeader from "./ExperimentHeader";
import ExperimentSidePanel from "./ExperimentSidePanel";
import FloatingWindowsManager from "./FloatingWindowsManager";
import SimulationCharts from "../charts/SimulationCharts";

export default function WorkspaceShell({
    experiment,
    user,
    isRTL,
    experiments,
    experimentsByCategory,
    children,
    simulationState,
    onStart,
    onPause,
    onContinue,
    onReset,
    onStep,
    onStepBackward,
    onScrub,
    currentTime,
    playbackTime,
    displayedDataPoint,
    simulationData = [],
    parameters,
    paramValues,
    onParameterChange,
    selectedPreset,
    onApplyPreset,
    validationState,
    onSave,
    onExport,
    canSave = false,
    canExport = false,
    handleLogout,
    maxSimulationTime
}) {
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [activeTab, setActiveTab] = useState("parameters");
    const [floatingWindows, setFloatingWindows] = useState({
        console: false,
        charts: false
    });
    const [isChartsOpen, setIsChartsOpen] = useState(false);

    const handleFloatConsole = () => {
        setFloatingWindows(prev => ({
            ...prev,
            console: true
        }));
        setActiveTab("parameters");
    };

    const handleCloseFloatingConsole = () => {
        setFloatingWindows(prev => ({
            ...prev,
            console: false
        }));
    };

    const handleToggleCharts = () => {
        setIsChartsOpen(prev => !prev);
    };

    const handleCloseFloatingCharts = () => {
        setFloatingWindows(prev => ({
            ...prev,
            charts: false
        }));
    };

    const effectiveTime =
        typeof currentTime === "number"
            ? currentTime
            : typeof playbackTime === "number"
            ? playbackTime
            : 0;

    // Flatten nested object outputs (e.g. `position: { y }` on Free Fall) so recharts
    // and CurrentValuesDisplay receive numeric values for `experiment.outputs`, and
    // filter time-series points up to the current playback time when playing/scrubbing.
    const normalizedSimulationData = useMemo(() => {
        if (!Array.isArray(simulationData) || simulationData.length === 0) {
            return [];
        }
        return simulationData.map((point) => {
            if (!point || typeof point !== "object") return point;
            if (
                point.position &&
                typeof point.position === "object" &&
                typeof point.position.y === "number"
            ) {
                return {
                    ...point,
                    position: point.position.y,
                    position_y: point.position.y,
                };
            }
            return point;
        });
    }, [simulationData]);

    const filteredSimulationData = useMemo(() => {
        if (normalizedSimulationData.length === 0) return [];
        const hasTimeAxis = typeof normalizedSimulationData[0]?.time === "number";
        if (!hasTimeAxis) {
            return normalizedSimulationData;
        }
        // When playback is at 0 before scrubbing in a completed state, or during playback,
        // show points up to effectiveTime; if effectiveTime === 0 and simulation completed,
        // still include at least the first point so controls know data exists.
        const upToTime = normalizedSimulationData.filter(
            (dataPoint) => dataPoint.time <= effectiveTime + 1e-9
        );
        return upToTime.length > 0 ? upToTime : normalizedSimulationData.slice(0, 1);
    }, [normalizedSimulationData, effectiveTime]);

    return (
        <div className="h-screen flex flex-col bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
            <ExperimentHeader
                experiment={experiment}
                user={user}
                isRTL={isRTL}
                experiments={experiments}
                experimentsByCategory={experimentsByCategory}
                onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
                isRightPanelOpen={isRightPanelOpen}
                onSave={onSave}
                onExport={onExport}
                onLogout={handleLogout}
                canSave={canSave}
                canExport={canExport}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Container for canvas and side panel - positioned relatively */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Canvas - always full width and height */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-100 to-slate-200">
                        {children}
                    </div>

                    {/* Side Panel - floating over the canvas with absolute positioning */}
                    <AnimatePresence>
                        {isRightPanelOpen && (
                            <ExperimentSidePanel
                                isOpen={isRightPanelOpen}
                                isRTL={isRTL}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                experiment={experiment}
                                parameters={parameters}
                                paramValues={paramValues}
                                onParameterChange={onParameterChange}
                                selectedPreset={selectedPreset}
                                onApplyPreset={onApplyPreset}
                                simulationState={simulationState}
                                onStart={onStart}
                                onPause={onPause}
                                onContinue={onContinue}
                                onReset={onReset}
                                onStepForward={onStep}
                                onStepBackward={onStepBackward}
                                onScrub={onScrub}
                                currentTime={effectiveTime}
                                playbackTime={playbackTime}
                                displayedDataPoint={displayedDataPoint}
                                simulationData={normalizedSimulationData}
                                validationState={validationState}
                                onFloatConsole={handleFloatConsole}
                                showConsole={!floatingWindows.console}
                                maxSimulationTime={maxSimulationTime}
                            />
                        )}
                    </AnimatePresence>

                    {/* Floating Console / Charts Windows */}
                    {(floatingWindows.console || floatingWindows.charts) && (
                        <FloatingWindowsManager
                            floatingWindows={floatingWindows}
                            simulationState={simulationState}
                            onStart={onStart}
                            onPause={onPause}
                            onContinue={onContinue}
                            onReset={onReset}
                            onStepForward={onStep}
                            onStepBackward={onStepBackward}
                            onScrub={onScrub}
                            currentTime={effectiveTime}
                            playbackTime={playbackTime}
                            displayedDataPoint={displayedDataPoint}
                            simulationData={normalizedSimulationData}
                            experiment={experiment}
                            isRTL={isRTL}
                            onToggleConsole={handleCloseFloatingConsole}
                            onToggleCharts={handleCloseFloatingCharts}
                            maxSimulationTime={maxSimulationTime}
                        />
                    )}
                </div>

                {/* Charts Panel - at the bottom */}
                <SimulationCharts
                    simulationData={filteredSimulationData}
                    experiment={experiment}
                    isRTL={isRTL}
                    isOpen={isChartsOpen}
                    onToggle={handleToggleCharts}
                />
            </div>
        </div>
    );
}
