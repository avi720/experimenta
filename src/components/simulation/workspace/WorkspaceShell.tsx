import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "@/i18n";
import ExperimentHeader, { type ExperimentMenuItem } from "./ExperimentHeader";
import ExperimentSidePanel from "./ExperimentSidePanel";
import FloatingWindowsManager from "./FloatingWindowsManager";
import SimulationCharts from "../charts/SimulationCharts";
import BlackHoleBackdrop from "@/components/brand/BlackHoleBackdrop";
import type { ExperimentTemplateData, Parameter, ParameterValues } from "@/types/experiment";
import type { AppSettings, AppUser } from "@/types/models";
import type { ChildrenProps, IsRTLProps } from "@/types/props";
import type { SimulationConsoleHandlers, SimulationDataPoint } from "@/types/simulation";
import type { ExperimentChallenge } from "@/hooks/simulation/useExperimentChallenge";

type WorkspaceShellProps = ChildrenProps &
    IsRTLProps &
    Omit<SimulationConsoleHandlers, "onStepForward"> & {
        experiment?: ExperimentTemplateData | null;
        user?: AppUser | null;
        experiments?: ExperimentMenuItem[];
        experimentsByCategory?: Record<string, ExperimentMenuItem[]>;
        onStep: () => void;
        parameters?: Parameter[];
        paramValues?: ParameterValues;
        onParameterChange?: (values: ParameterValues) => void;
        selectedPreset?: string;
        onApplyPreset: (value: string) => void;
        onSave?: () => void;
        onExport?: () => void;
        canSave?: boolean;
        canExport?: boolean;
        handleLogout?: () => void;
        /** Passed by the workspace page; not used by the shell. */
        settings?: AppSettings | null;
        /** Passed by the workspace page; not used by the shell. */
        maxSimulationTime?: number;
        /** "Find the unknown" state, with the experiment's guide (equations, quantities). */
        challenge?: ExperimentChallenge;
    };

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
    challenge
}: WorkspaceShellProps) {
    const { dir, pick } = useTranslation(isRTL);
    const guide = challenge?.guide ?? null;
    const hiddenKeys = challenge?.hiddenKeys ?? [];
    const hiddenOption = challenge?.isHiding
        ? challenge.options.find((o) => o.spec.key === challenge.state?.key)
        : undefined;
    const unknown = hiddenOption
        ? { spec: hiddenOption.spec, label: pick(hiddenOption.parameter.i18n_labels, hiddenOption.parameter.key) }
        : null;
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
    const normalizedSimulationData = useMemo((): SimulationDataPoint[] => {
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
        const upToTime = normalizedSimulationData.filter(
            (dataPoint) => typeof dataPoint.time === "number" && dataPoint.time <= effectiveTime + 1e-9
        );
        return upToTime.length > 0 ? upToTime : normalizedSimulationData.slice(0, 1);
    }, [normalizedSimulationData, effectiveTime]);

    return (
        <div className="h-screen flex flex-col bg-space text-star" dir={dir}>
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
                guide={guide}
                unknown={unknown}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Container for canvas and side panel - positioned relatively */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Space backdrop: a decorative animation behind the transparent scene canvas */}
                    <div className="absolute inset-0 bg-space">
                        {/* The panel sits at the inline start, so the hole goes to the end side. */}
                        <BlackHoleBackdrop side={dir === "rtl" ? "left" : "right"} />
                    </div>

                    {/* Canvas - always full width and height */}
                    <div className="absolute inset-0 w-full h-full">
                        {children}
                    </div>

                    {/* Side Panel - floating over the canvas with absolute positioning */}
                    <AnimatePresence>
                        {isRightPanelOpen && (
                            <ExperimentSidePanel
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
                                challenge={challenge}
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
                            validationState={validationState}
                            guide={guide}
                            hiddenKeys={hiddenKeys}
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
                    guide={guide}
                    hiddenKeys={hiddenKeys}
                />
            </div>
        </div>
    );
}
