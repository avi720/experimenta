import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";

/**
 * רשימה נפתחת לבחירת Presets
 */
export default function PresetsDropdown({
    presets,
    selectedPreset,
    onApplyPreset,
    isRTL
}) {
    if (!presets || presets.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Sparkles className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                    {isRTL ? "תצורות מוגדרות מראש" : "Presets"}
                </span>
            </div>
            <Select value={selectedPreset} onValueChange={onApplyPreset}>
                <SelectTrigger>
                    <SelectValue placeholder={isRTL ? "בחר תצורה" : "Select preset"} />
                </SelectTrigger>
                <SelectContent>
                    {presets.map((preset, index) => (
                        <SelectItem key={index} value={index.toString()}>
                            {isRTL ? preset.name_he : preset.name_en}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}