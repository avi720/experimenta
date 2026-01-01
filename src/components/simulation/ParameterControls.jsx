import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import ParameterInput from "./parameters/ParameterInput";
import PresetsDropdown from "./parameters/PresetsDropdown";

export default function ParameterControls({
    experiment,
    parameters,
    paramValues,
    onParameterChange,
    selectedPreset,
    onApplyPreset,
    validationState,
    isRTL
}) {
    console.log('ParameterControls: Rendering', { 
        parametersCount: parameters?.length,
        paramValues,
        onParameterChange: typeof onParameterChange
    });

    const handleParamChange = (key, value) => {
        console.log('ParameterControls: handleParamChange called', { key, value });
        if (onParameterChange) {
            const newValues = { ...paramValues, [key]: value };
            onParameterChange(newValues);
        } else {
            console.error('ParameterControls: onParameterChange is not defined');
        }
    };

    if (!parameters || parameters.length === 0) {
        return (
            <Card className="border-slate-200">
                <CardContent className="pt-6 text-center text-slate-500">
                    {isRTL ? "אין פרמטרים זמינים" : "No parameters available"}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {experiment?.presets && experiment.presets.length > 0 && (
                <Card className="border-slate-200 bg-gradient-to-br from-purple-50 to-blue-50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            {isRTL ? "תצורות מוכנות" : "Presets"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PresetsDropdown
                            presets={experiment.presets}
                            selectedPreset={selectedPreset}
                            onApplyPreset={onApplyPreset}
                            isRTL={isRTL}
                        />
                    </CardContent>
                </Card>
            )}

            <Card className="border-slate-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700">
                        {isRTL ? "הגדרות פרמטרים" : "Parameter Settings"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {parameters.map((param) => (
                        <ParameterInput
                            key={param.key}
                            parameter={param}
                            value={paramValues?.[param.key]}
                            onChange={(value) => handleParamChange(param.key, value)}
                            error={validationState?.errors?.[param.key]}
                            isRTL={isRTL}
                        />
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}