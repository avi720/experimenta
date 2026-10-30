import { Link, useLocation } from 'react-router-dom';
import { useAppData } from '@/hooks/useAppData';
import { useTranslation } from '@/i18n';
import { primaryActionClass } from '@/components/pagesComponents/dashboard/actionStyles';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);
    const { isRTL } = useAppData();
    const { t, dir } = useTranslation(isRTL);

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 py-20" dir={dir}>
            <div className="max-w-xl w-full text-center">
                {/* A still event horizon: the hole's shadow inside its photon ring, with the 404 lost inside it. */}
                <div
                    aria-hidden="true"
                    className="mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-hole shadow-[0_0_0_1.5px_rgb(var(--plasma-hi)/0.9),0_-2px_24px_3px_rgb(var(--plasma)/0.45),0_-8px_80px_20px_rgb(255_120_60/0.16),-60px_-10px_80px_-20px_rgb(var(--blueshift)/0.2)]"
                >
                    <span className="font-mono text-[15px] text-dust/70">404</span>
                </div>

                <h1 className="mt-14 text-[clamp(2rem,4.5vw,3rem)] font-light leading-[1.1] tracking-[-0.01em] text-star">
                    {t('errors.notFoundHorizonTitle')}
                </h1>
                <p className="mx-auto mt-5 max-w-[34rem] text-[17px] leading-[1.7] text-dust">
                    {t('errors.notFoundHorizonBody')}
                </p>
                <p className="mx-auto mt-3 max-w-[34rem] text-[15px] leading-[1.6] text-dust/80">
                    {t('errors.notFoundPrefix')}{' '}
                    <span className="font-mono text-[14px] text-star" dir="ltr">/{pageName}</span>{' '}
                    {t('errors.notFoundSuffix')}
                </p>

                <div className="mt-10">
                    <Link to="/" className={primaryActionClass}>
                        {t('common.backToHome')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
