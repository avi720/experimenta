import { useTranslation } from "@/i18n";
import FloatingWindow from "../FloatingWindow";
import SimulationConsole from "../SimulationConsole";
import SimulationCharts from "../charts/SimulationCharts";
import type { ExperimentTemplateData } from "@/types/experiment";
import type { IsRTLProps } from "@/types/props";
import type { SimulationConsoleHandlers } from "@/types/simulation";
import type { ExperimentGuide } from "@/simulation/guides";

type FloatingWindowsManagerProps = IsRTLProps & SimulationConsoleHandlers & {
    experiment?: ExperimentTemplateData | null;
    floatingWindows?: { console?: boolean; charts?: boolean };
    onToggleConsole?: () => void;
    onToggleCharts?: () => void;
    guide?: ExperimentGuide | null;
    hiddenKeys?: ReadonlyArray<string>;
};

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
    validationState,
    onToggleConsole,
    onToggleCharts,
    guide,
    hiddenKeys
}: FloatingWindowsManagerProps) {
    const { t } = useTranslation(isRTL);

    return (
        <>
            {floatingWindows?.console && (
                <FloatingWindow
                    title={t("workspace.simulationConsoleTitle")}
                    defaultPosition={{ x: 20, y: 100 }}
                    defaultSize={{ width: 400, height: 500 }}
                    onClose={onToggleConsole}
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
                        isRTL={isRTL}
                        validationState={validationState}
                        guide={guide}
                        hiddenKeys={hiddenKeys}
                    />
                </FloatingWindow>
            )}

            {floatingWindows?.charts && (
                <FloatingWindow
                    title={t("workspace.chartsWindowTitle")}
                    defaultPosition={{ x: 440, y: 100 }}
                    defaultSize={{ width: 600, height: 500 }}
                    onClose={onToggleCharts}
                >
                    <SimulationCharts
                        simulationData={simulationData}
                        experiment={experiment}
                        isRTL={isRTL}
                        guide={guide}
                        hiddenKeys={hiddenKeys}
                    />
                </FloatingWindow>
            )}
        </>
    );
}
