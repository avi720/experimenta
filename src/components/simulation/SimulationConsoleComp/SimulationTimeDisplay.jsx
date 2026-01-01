import React from 'react';
import { Clock } from 'lucide-react';

export default function SimulationTimeDisplay({ 
    playbackTime, 
    maxAvailableTime,
    isRTL 
}) {
    return (
        <div className="flex items-center justify-center gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-mono">
                    {playbackTime?.toFixed(3) || '0.000'}
                </span>
                <span>{isRTL ? 's' : 's'}</span>
            </div>
            
            <span className="text-slate-400">/</span>
            
            <div className="flex items-center gap-2">
                <span className="font-mono">
                    {maxAvailableTime?.toFixed(3) || '0.000'}
                </span>
                <span>{isRTL ? 's' : 's'}</span>
            </div>
        </div>
    );
}