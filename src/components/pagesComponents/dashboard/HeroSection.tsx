import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useTranslation } from '@/i18n';
import { getExperimentPageUrl } from '@/components/pagesComponents/lab/labConstants';
import BlackHoleField from './BlackHoleField';
import { primaryActionClass, secondaryActionClass } from './actionStyles';
import type { AppSettings } from '@/types/models';
import type { IsRTLProps } from '@/types/props';

type HeroSectionProps = IsRTLProps & { settings: AppSettings | null; hasDoubleSlit: boolean };

export default function HeroSection({ settings, isRTL, hasDoubleSlit }: HeroSectionProps) {
    const { t, dir } = useTranslation(isRTL);
    const [meters, setMeters] = useState({ inDisk: 0, crossed: 0 });
    const onMeters = useCallback((inDisk: number, crossed: number) => setMeters({ inDisk, crossed }), []);
    const format = new Intl.NumberFormat(isRTL ? 'he-IL' : 'en-US');

    return (
        <section
            aria-labelledby="hero-title"
            data-scroll="hero"
            className="relative isolate overflow-hidden flex flex-col min-h-[calc(100svh-4rem)] touch-pan-y"
        >
            <BlackHoleField dir={dir} label={t('dashboard.disk.canvasLabel')} onMeters={onMeters} className="-z-20 motion-hero-field" />
            {/* Scrim on the headline side keeps the text legible over the disk. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-space from-0% via-space/90 via-[38%] to-space/0 to-60%
                    md:bg-gradient-to-r md:rtl:bg-gradient-to-l md:via-[40%] md:to-[62%]"
            />

            {/* The copy hugs the reading-start edge of the screen, leaving the rest to the hole. */}
            <div className="flex-1 flex flex-col justify-start md:justify-center px-6 md:px-[clamp(24px,6vw,112px)] pt-10 pb-[300px] md:py-16 pointer-events-none">
                <div className="motion-hero-copy max-w-[36rem]">
                    <h1
                        id="hero-title"
                        className="text-[clamp(2.6rem,6vw,5.3rem)] font-light leading-[1.04] tracking-[-0.02em] text-star text-balance"
                    >
                        {t('dashboard.heroTitle')}
                    </h1>
                    <p className="mt-6 max-w-[32rem] text-[19px] leading-[1.7] text-dust">
                        {t('dashboard.heroSubtitle')}
                    </p>

                    {settings?.virtual_lab_enabled ? (
                        <div className="mt-10 flex flex-wrap gap-3 pointer-events-auto">
                            <Link to={createPageUrl("Lab")} className={primaryActionClass}>
                                {t('dashboard.openLab')}
                            </Link>
                            {hasDoubleSlit && (
                                <Link to={getExperimentPageUrl('double-slit')} className={secondaryActionClass}>
                                    {t('dashboard.tryDoubleSlit')}
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="mt-10 max-w-[30rem] border-s-2 border-blueshift ps-4">
                            <p className="text-[17px] text-star">{t('dashboard.labComingSoonTitle')}</p>
                            <p className="mt-1 text-[15px] leading-relaxed text-dust">{t('dashboard.labComingSoonDescription')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Readout of the live field above. */}
            <div className="border-t border-line/70 bg-space/70 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-end gap-8 text-[13px] text-dust" aria-hidden="true">
                    <span className="flex items-baseline gap-2.5">
                        {t('dashboard.disk.inDisk')}
                        <b className="font-mono font-normal tabular-nums text-[20px] leading-none text-star">{format.format(meters.inDisk)}</b>
                    </span>
                    <span className="flex items-baseline gap-2.5">
                        {t('dashboard.disk.crossed')}
                        <b className="font-mono font-normal tabular-nums text-[20px] leading-none text-plasma">{format.format(meters.crossed)}</b>
                    </span>
                </div>
            </div>
        </section>
    );
}
