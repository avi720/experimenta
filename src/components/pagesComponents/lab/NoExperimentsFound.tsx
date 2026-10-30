import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { IsRTLProps } from '@/types/props';

export default function NoExperimentsFound({ isRTL }: IsRTLProps) {
    const { t } = useTranslation(isRTL);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-t border-line py-16 md:py-20"
        >
            <span className="mb-6 flex h-10 w-10 items-center justify-center rounded-md border border-line bg-space-raised">
                <Search className="h-5 w-5 text-dust" aria-hidden="true" />
            </span>
            <h3 className="text-[clamp(1.5rem,3vw,1.9rem)] font-light leading-[1.12] text-star">
                {t('lab.noExperimentsTitle')}
            </h3>
            <p className="mt-3 max-w-[34rem] text-[17px] leading-[1.7] text-dust">
                {t('lab.noExperimentsDescription')}
            </p>
        </motion.div>
    );
}
