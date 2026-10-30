import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import { secondaryActionClass } from '@/components/pagesComponents/dashboard/actionStyles';
import type { IsRTLProps } from '@/types/props';

export default function LabUnavailableMessage({ isRTL }: IsRTLProps) {
    const { t, dir } = useTranslation(isRTL);

    return (
        <div className="min-h-[70vh] flex items-center px-4 sm:px-6" dir={dir}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mx-auto w-full max-w-6xl"
            >
                <div className="max-w-[36rem] border-t border-line pt-10">
                    <span className="mb-6 flex h-10 w-10 items-center justify-center rounded-md border border-line bg-space-raised">
                        <BookOpen className="h-5 w-5 text-dust" aria-hidden="true" />
                    </span>
                    <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-light leading-[1.1] text-star">
                        {t('lab.unavailableTitle')}
                    </h2>
                    <p className="mt-4 text-[17px] leading-[1.7] text-dust">
                        {t('lab.unavailableDescription')}
                    </p>
                    <Link to={createPageUrl("Dashboard")} className={`${secondaryActionClass} mt-8`}>
                        {t('common.backToHome')}
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
