import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { isParameterVisible } from "@/simulation/parameterValidation";
import ParameterControls from "../ParameterControls";
import SimulationConsole from "../SimulationConsole";
import type { ExperimentTemplateData, Parameter, ParameterValues } from "@/types/experiment";
import type { IsRTLProps } from "@/types/props";
import type { SimulationConsoleHandlers } from "@/types/simulation";
import { instrumentSurfaceClass } from "./workspaceStyles";
import type { ExperimentChallenge } from "@/hooks/simulation/useExperimentChallenge";

// Underlined tabs: dust at rest, star with a plasma line when active (the brand nav idiom).
const tabTriggerClass =
    "focus-ring h-full flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-2 text-[14px] font-normal text-dust shadow-none hover:text-star data-[state=active]:border-plasma data-[state=active]:bg-transparent data-[state=active]:text-star data-[state=active]:shadow-none";

type ExperimentSidePanelProps = IsRTLProps & SimulationConsoleHandlers & {
    activeTab: string;
    onTabChange: (value: string) => void;
    experiment?: ExperimentTemplateData | null;
    parameters?: Parameter[];
    paramValues?: ParameterValues;
    onParameterChange?: (values: ParameterValues) => void;
    selectedPreset?: string;
    onApplyPreset: (value: string) => void;
    onFloatConsole?: () => void;
    showConsole?: boolean;
    challenge?: ExperimentChallenge;
};

export default function ExperimentSidePanel({
    isRTL,
    activeTab,
    onTabChange,
    experiment,
    parameters,
    paramValues,
    onParameterChange,
    selectedPreset,
    onApplyPreset,
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
    onFloatConsole,
    showConsole = true,
    challenge
}: ExperimentSidePanelProps) {
    const { t, locale, dir } = useTranslation(isRTL);
    // The panel sits at the inline start: the right edge in Hebrew, the left in English.
    const slideOffset = locale === "he" ? 400 : -400;

    // Only active parameters whose `visible_when` condition holds for the current values.
    const activeParameters = (parameters || []).filter((param) => isParameterVisible(param, paramValues));

    return (
        <motion.div
            initial={{ x: slideOffset, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: slideOffset, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn("absolute top-0 start-0 border-e h-full w-[calc(100%-1.5rem)] sm:w-96 shadow-2xl shadow-hole/60 z-30 flex flex-col", instrumentSurfaceClass)}
        >
            {/* Radix Tabs defaults to dir="ltr", which would turn the whole panel left-to-right in Hebrew. */}
            <Tabs dir={dir} value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col overflow-hidden">
                <div className="border-b border-line px-4 flex-shrink-0">
                    <TabsList className="grid w-full grid-cols-2 h-11 rounded-none bg-transparent p-0">
                        <TabsTrigger value="parameters" className={tabTriggerClass}>
                            <Settings className="w-4 h-4" />
                            <span>{t("workspace.parametersTab")}</span>
                        </TabsTrigger>
                        <TabsTrigger value="console" className={tabTriggerClass}>
                            <PlayCircle className="w-4 h-4" />
                            <span>{t("workspace.consoleTab")}</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                    <TabsContent value="parameters" className="p-4 m-0 h-full overflow-y-auto">
                        <ParameterControls
                            experiment={experiment}
                            parameters={activeParameters}
                            paramValues={paramValues}
                            onParameterChange={onParameterChange}
                            selectedPreset={selectedPreset}
                            onApplyPreset={onApplyPreset}
                            validationState={validationState}
                            challenge={challenge}
                            isRTL={isRTL}
                        />
                    </TabsContent>

                    <TabsContent value="console" className="p-4 m-0 h-full overflow-y-auto">
                        {showConsole ? (
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
                                onFloat={onFloatConsole}
                                validationState={validationState}
                                guide={challenge?.guide}
                                hiddenKeys={challenge?.hiddenKeys}
                            />
                        ) : (
                            <div className="border border-dashed border-line rounded-md p-6 text-center">
                                <p className="text-sm text-dust">
                                    {t("workspace.consoleInFloatingWindow")}
                                </p>
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </motion.div>
    );
}
