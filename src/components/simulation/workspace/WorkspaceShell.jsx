import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import ExperimentHeader from "./ExperimentHeader";
import ExperimentSidePanel from "./ExperimentSidePanel";
import ExperimentCanvas from "./ExperimentCanvas";
import FloatingWindowsManager from "./FloatingWindowsManager";
import SimulationCharts from "../charts/SimulationCharts";

export default function WorkspaceShell({
    experiment,
    user,
    isRTL,
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
    simulationData,
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
        console: false
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

    const isInitializing = simulationState === 'initializing';

    // סינון הנתונים - הצגת רק נקודות עד הזמן הנוכחי
    const filteredSimulationData = simulationData.filter(
        (dataPoint) => dataPoint.time <= currentTime
    );

    return (
        <div className="h-screen flex flex-col bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
            <ExperimentHeader
                experiment={experiment}
                user={user}
                isRTL={isRTL}
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
                    <ExperimentCanvas isInitializing={isInitializing} isRTL={isRTL}>
                        {children}
                    </ExperimentCanvas>

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
                                currentTime={currentTime}
                                playbackTime={playbackTime}
                                simulationData={filteredSimulationData}
                                validationState={validationState}
                                onFloatConsole={handleFloatConsole}
                                showConsole={!floatingWindows.console}
                                maxSimulationTime={maxSimulationTime}
                            />
                        )}
                    </AnimatePresence>

                    {/* Floating Console Window */}
                    {floatingWindows.console && (
                        <FloatingWindowsManager
                            simulationState={simulationState}
                            onStart={onStart}
                            onPause={onPause}
                            onContinue={onContinue}
                            onReset={onReset}
                            onStep={onStep}
                            onStepBackward={onStepBackward}
                            onScrub={onScrub}
                            currentTime={currentTime}
                            playbackTime={playbackTime}
                            simulationData={filteredSimulationData}
                            experiment={experiment}
                            isRTL={isRTL}
                            onClose={handleCloseFloatingConsole}
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