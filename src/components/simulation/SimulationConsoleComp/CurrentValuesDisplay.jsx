import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

/**
 * תצוגת ערכים נוכחיים מהסימולציה
 */
export default function CurrentValuesDisplay({
    displayedDataPoint,
    isRTL
}) {
    if (!displayedDataPoint) {
        return (
            <Card className="bg-slate-50">
                <CardContent className="p-4">
                    <div className="flex items-center justify-center text-slate-400 space-x-2 rtl:space-x-reverse">
                        <Activity className="w-5 h-5" />
                        <span className="text-sm">
                            {isRTL ? "אין נתונים להצגה" : "No data to display"}
                        </span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-800">
                        {isRTL ? "ערכים נוכחיים" : "Current Values"}
                    </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(displayedDataPoint).map(([key, value]) => {
                        if (key === 'time') return null;
                        
                        return (
                            <div key={key} className="bg-white/70 rounded-lg p-2">
                                <div className="text-xs text-slate-600 mb-1">
                                    {key.replace(/_/g, ' ')}
                                </div>
                                <div className="text-sm font-mono font-semibold text-slate-900">
                                    {typeof value === 'number' ? value.toFixed(4) : value}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}