import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useTranslation } from '@/i18n';
import { getExperimentPageUrl } from '@/components/pagesComponents/lab/labConstants';
import { primaryActionClass, secondaryActionClass } from './actionStyles';
import type { IsRTLProps } from '@/types/props';

type FinalCtaSectionProps = IsRTLProps & { hasFreeFall: boolean };

// The page falls toward an event horizon; the footer below sits inside it.
export default function FinalCtaSection({ isRTL, hasFreeFall }: FinalCtaSectionProps) {
    const { t } = useTranslation(isRTL);

    return (
        <section
            aria-labelledby="cta-title"
            data-scroll="cta"
            className="relative overflow-hidden border-t border-line/70 px-6 pt-24 pb-[240px] md:pt-[136px] md:pb-[360px] text-center"
        >
            <h2
                id="cta-title"
                className="motion-cta-title mx-auto max-w-[20ch] text-[clamp(2rem,4.4vw,3.6rem)] font-light leading-[1.12] tracking-[-0.01em] text-star text-balance"
            >
                {t('dashboard.ctaTitle')}
            </h2>
            <p className="motion-cta-body mt-6 mx-auto max-w-[34rem] text-[19px] leading-[1.7] text-dust">
                {t('dashboard.ctaBody')}
            </p>
            <div className="motion-cta-actions mt-10 flex flex-wrap justify-center gap-3">
                <Link
                    to={hasFreeFall ? getExperimentPageUrl('free-fall') : createPageUrl("Lab")}
                    className={primaryActionClass}
                >
                    {t('dashboard.ctaPrimary')}
                </Link>
                <Link to={createPageUrl("Lab")} className={secondaryActionClass}>
                    {t('dashboard.ctaSecondary')}
                </Link>
            </div>
            <div className="event-horizon" aria-hidden="true" />
        </section>
    );
}
