import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { Preset } from "@/types/experiment";
import type { IsRTLProps } from "@/types/props";

type PresetsDropdownProps = IsRTLProps & {
    presets?: Preset[];
    selectedPreset?: string;
    onApplyPreset: (value: string) => void;
};

/**
 * רשימה נפתחת לבחירת Presets
 */
export default function PresetsDropdown({
    presets,
    selectedPreset,
    onApplyPreset,
    isRTL
}: PresetsDropdownProps) {
    const { t, pick } = useTranslation(isRTL);

    if (!presets || presets.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-dust" aria-hidden="true" />
                <span className="text-sm text-dust">
                    {t("workspace.presetsLabel")}
                </span>
            </div>
            <Select value={selectedPreset} onValueChange={onApplyPreset}>
                <SelectTrigger className="focus-ring bg-space/60 border-line text-star hover:border-blueshift/60">
                    <SelectValue placeholder={t("workspace.selectPresetPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="bg-space-raised border-line">
                    {presets.map((preset, index) => (
                        <SelectItem key={index} value={index.toString()}>
                            {pick(preset)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
