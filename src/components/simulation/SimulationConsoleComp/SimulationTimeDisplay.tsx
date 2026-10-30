import { useTranslation } from '@/i18n';
import type { IsRTLProps } from '@/types/props';

type SimulationTimeDisplayProps = IsRTLProps & {
    playbackTime?: number;
    maxAvailableTime?: number;
};

/** The console clock: elapsed time as a large live readout, the computed span beside it. */
export default function SimulationTimeDisplay({
    playbackTime,
    maxAvailableTime,
    isRTL
}: SimulationTimeDisplayProps) {
    const { t } = useTranslation(isRTL);

    return (
        <div className="flex items-baseline justify-center gap-3 border-y border-line py-3">
            <div className="flex items-baseline gap-1.5">
                <span className="font-mono tabular-nums text-[30px] leading-none text-plasma" dir="ltr">
                    {playbackTime?.toFixed(3) || '0.000'}
                </span>
                <span className="text-sm text-dust">{t('common.secondsShort')}</span>
            </div>

            <span className="text-lg text-line" aria-hidden="true">/</span>

            <div className="flex items-baseline gap-1.5 text-dust">
                <span className="font-mono tabular-nums text-sm" dir="ltr">
                    {maxAvailableTime?.toFixed(3) || '0.000'}
                </span>
                <span className="text-sm">{t('common.secondsShort')}</span>
            </div>
        </div>
    );
}
