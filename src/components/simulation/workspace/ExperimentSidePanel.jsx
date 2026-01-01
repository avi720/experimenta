import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, PlayCircle } from "lucide-react";
import ParameterControls from "../ParameterControls";
import SimulationConsole from "../SimulationConsole";

export default function ExperimentSidePanel({
    isOpen,
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
    simulationData,
    validationState,
    onFloatConsole,
    showConsole = true,
    maxSimulationTime
}) {
    // סינון פרמטרים - הצגת רק פרמטרים פעילים ותקינים
    const activeParameters = (parameters || []).filter(param => 
        param && 
        param.key && 
        param.is_active !== false
    );

    return (
        <motion.div
            initial={{ x: isRTL ? -400 : 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isRTL ? -400 : 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-96 bg-white/95 backdrop-blur-sm shadow-2xl border-${isRTL ? 'r' : 'l'} border-slate-200 z-30 flex flex-col`}
        >
            <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col overflow-hidden">
                <div className="border-b border-slate-200 px-4 py-3 flex-shrink-0">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                        <TabsTrigger value="parameters" className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            <span>{isRTL ? "פרמטרים" : "Parameters"}</span>
                        </TabsTrigger>
                        <TabsTrigger value="console" className="flex items-center gap-2">
                            <PlayCircle className="w-4 h-4" />
                            <span>{isRTL ? "קונסולה" : "Console"}</span>
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
                                simulationData={simulationData}
                                isRTL={isRTL}
                                onFloat={onFloatConsole}
                                maxSimulationTime={maxSimulationTime}
                            />
                        ) : (
                            <Card className="p-6 text-center">
                                <p className="text-slate-500">
                                    {isRTL 
                                        ? "הקונסולה מוצגת בחלון צף" 
                                        : "Console is shown in floating window"
                                    }
                                </p>
                            </Card>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </motion.div>
    );
}