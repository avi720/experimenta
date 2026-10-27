import { Clock } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { IsRTLProps } from '@/types/props';

type SimulationTimeDisplayProps = IsRTLProps & {
    playbackTime?: number;
    maxAvailableTime?: number;
};

export default function SimulationTimeDisplay({ 
    playbackTime, 
    maxAvailableTime,
    isRTL 
}: SimulationTimeDisplayProps) {
    const { t } = useTranslation(isRTL);

    return (
        <div className="flex items-center justify-center gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-mono">
                    {playbackTime?.toFixed(3) || '0.000'}
                </span>
                <span>{t('common.secondsShort')}</span>
            </div>
            
            <span className="text-slate-400">/</span>
            
            <div className="flex items-center gap-2">
                <span className="font-mono">
                    {maxAvailableTime?.toFixed(3) || '0.000'}
                </span>
                <span>{t('common.secondsShort')}</span>
            </div>
        </div>
    );
}
