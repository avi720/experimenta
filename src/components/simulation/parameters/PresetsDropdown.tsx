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
                <Sparkles className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                    {t("workspace.presetsLabel")}
                </span>
            </div>
            <Select value={selectedPreset} onValueChange={onApplyPreset}>
                <SelectTrigger>
                    <SelectValue placeholder={t("workspace.selectPresetPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
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
