import { Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n";
import { panelHeadingClass } from "./workspace/workspaceStyles";
import ParameterInput from "./parameters/ParameterInput";
import PresetsDropdown from "./parameters/PresetsDropdown";
import ChallengeSection, { LockedParameter } from "./parameters/ChallengeSection";
import type { ExperimentChallenge } from "@/hooks/simulation/useExperimentChallenge";
import type { ExperimentTemplateData, Parameter, ParameterValues } from "@/types/experiment";
import type { IsRTLProps } from "@/types/props";
import type { ParameterValidationState } from "@/types/simulation";

type ParameterControlsProps = IsRTLProps & {
    experiment?: Pick<ExperimentTemplateData, "presets"> | null;
    parameters?: Parameter[];
    paramValues?: ParameterValues;
    onParameterChange?: (values: ParameterValues) => void;
    selectedPreset?: string;
    onApplyPreset: (value: string) => void;
    validationState?: ParameterValidationState;
    challenge?: ExperimentChallenge;
};

export default function ParameterControls({
    experiment,
    parameters,
    paramValues,
    onParameterChange,
    selectedPreset,
    onApplyPreset,
    validationState,
    challenge,
    isRTL
}: ParameterControlsProps) {
    const { t } = useTranslation(isRTL);

    const handleParamChange = (key: string, value: ParameterValues[string]) => {
        if (onParameterChange) {
            const newValues = { ...paramValues, [key]: value };
            onParameterChange(newValues);
        } else {
            console.error('ParameterControls: onParameterChange is not defined');
        }
    };

    if (!parameters || parameters.length === 0) {
        return (
            <div className="border border-dashed border-line rounded-md p-6 text-center text-sm text-dust">
                {t("workspace.noParametersAvailable")}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {challenge && <ChallengeSection challenge={challenge} isRTL={isRTL} />}

            {experiment?.presets && experiment.presets.length > 0 && (
                <section className="space-y-3 pb-5 border-b border-line">
                    <h3 className={`${panelHeadingClass} flex items-center gap-2`}>
                        <Sparkles className="w-4 h-4 text-blueshift" aria-hidden="true" />
                        {t("workspace.presetsCardTitle")}
                    </h3>
                    <PresetsDropdown
                        presets={experiment.presets}
                        selectedPreset={selectedPreset}
                        onApplyPreset={onApplyPreset}
                        isRTL={isRTL}
                    />
                </section>
            )}

            <section className="space-y-4">
                <h3 className={panelHeadingClass}>
                    {t("workspace.parameterSettingsTitle")}
                </h3>
                <div className="space-y-5">
                    {parameters.map((param) => {
                        const hidden = challenge?.isHiding && challenge.state?.key === param.key
                            ? challenge.options.find((o) => o.spec.key === param.key)
                            : undefined;
                        if (hidden) {
                            const limit = (v: unknown, fallback: number) => {
                                const n = parseFloat(String(v));
                                return Number.isFinite(n) ? n : fallback;
                            };
                            return (
                                <LockedParameter
                                    key={param.key}
                                    parameter={param}
                                    symbol={hidden.spec.symbol}
                                    range={{
                                        min: Math.max(hidden.spec.min, limit(param.min, -Infinity)),
                                        max: Math.min(hidden.spec.max, limit(param.max, Infinity)),
                                    }}
                                    isRTL={isRTL}
                                />
                            );
                        }
                        return (
                            <ParameterInput
                                key={param.key}
                                parameter={param}
                                value={paramValues?.[param.key]}
                                onChange={(value) => handleParamChange(param.key, value)}
                                error={validationState?.errors?.[param.key]}
                                validationState={validationState?.byKey?.[param.key]}
                                isRTL={isRTL}
                            />
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
