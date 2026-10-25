import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateParameterValue } from "./parameterValidation";

export default function ParameterInput({
    parameter,
    value,
    onChange,
    error,
    validationState,
    isRTL
}) {
    // בדיקת תקינות הפרמטר
    if (!parameter || !parameter.key) {
        console.error('ParameterInput: parameter is undefined or missing key');
        return null;
    }

    // ולידציה ממקור אמת יחיד (parameterValidation.js)
    const computedValidation =
        validationState && typeof validationState.isValid === "boolean"
            ? validationState
            : error
            ? { isValid: false, error }
            : validateParameterValue(parameter, value, isRTL);

    const isValid = computedValidation.isValid !== false;
    const errorMessage = error || computedValidation.error;

    // קבלת תווית בשפה הנכונה
    const getLabel = () => {
        if (!parameter.i18n_labels) return parameter.key;
        return isRTL ? (parameter.i18n_labels.he || parameter.key) : (parameter.i18n_labels.en || parameter.key);
    };

    // קבלת tooltip בשפה הנכונה
    const getTooltip = () => {
        if (!parameter.tooltip) return '';
        return isRTL ? (parameter.tooltip.he || '') : (parameter.tooltip.en || '');
    };

    const label = getLabel();
    const tooltip = getTooltip();

    // טיפול בפרמטרים מסוג boolean
    if (parameter.type === 'bool') {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor={parameter.key} className="text-sm font-medium">
                        {label}
                    </Label>
                    <Switch
                        id={parameter.key}
                        checked={value === true || value === 'true'}
                        onCheckedChange={(checked) => onChange(checked)}
                    />
                </div>
                {tooltip && <p className="text-xs text-slate-500">{tooltip}</p>}
            </div>
        );
    }

    // טיפול בפרמטרים מסוג select
    if (parameter.type === 'select' && parameter.options) {
        return (
            <div className="space-y-2">
                <Label htmlFor={parameter.key} className="text-sm font-medium flex items-center gap-2">
                    {label}
                    {!isValid && <AlertCircle className="w-4 h-4 text-red-500" />}
                </Label>
                <Select value={value?.toString()} onValueChange={(val) => onChange(val)}>
                    <SelectTrigger
                        id={parameter.key}
                        className={cn(!isValid && "border-red-500")}
                    >
                        <SelectValue placeholder={isRTL ? "בחר ערך" : "Select value"} />
                    </SelectTrigger>
                    <SelectContent>
                        {parameter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {isRTL ? (option.label_he || option.value) : (option.label_en || option.value)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {tooltip && <p className="text-xs text-slate-500">{tooltip}</p>}
                {!isValid && errorMessage && (
                    <p className="text-xs text-red-500 flex items-center gap-1" role="alert">
                        <AlertCircle className="w-3 h-3" />
                        {errorMessage}
                    </p>
                )}
            </div>
        );
    }

    // טיפול בפרמטרים נומריים (float, int)
    const isNumeric = parameter.type === 'float' || parameter.type === 'int';
    const step = parameter.step || (parameter.type === 'int' ? 1 : 0.01);

    return (
        <div className="space-y-2">
            <Label htmlFor={parameter.key} className="text-sm font-medium flex items-center gap-2">
                {label}
                {parameter.unit && <span className="text-slate-500 font-normal">({parameter.unit})</span>}
                {!isValid && <AlertCircle className="w-4 h-4 text-red-500" />}
            </Label>
            <Input
                id={parameter.key}
                type="number"
                value={value ?? ''}
                aria-invalid={!isValid}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                        onChange('');
                        return;
                    }
                    const numVal = Number(val);
                    if (!Number.isNaN(numVal)) {
                        onChange(numVal);
                    } else {
                        onChange(val);
                    }
                }}
                step={step}
                min={parameter.min}
                max={parameter.max}
                className={cn(!isValid && "border-red-500 focus:ring-red-500")}
            />
            {tooltip && <p className="text-xs text-slate-500">{tooltip}</p>}
            {!isValid && errorMessage && (
                <p className="text-xs text-red-500 flex items-center gap-1" role="alert">
                    <AlertCircle className="w-3 h-3" />
                    {errorMessage}
                </p>
            )}
            {isNumeric && (parameter.min !== undefined || parameter.max !== undefined) && isValid && (
                <p className="text-xs text-slate-400">
                    {isRTL ? "טווח: " : "Range: "}
                    {parameter.min !== undefined ? parameter.min : '∞'} - {parameter.max !== undefined ? parameter.max : '∞'}
                </p>
            )}
        </div>
    );
}
