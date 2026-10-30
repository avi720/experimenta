import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import type { Bilingual } from '@/types/experiment';
import type { IsRTLProps } from '@/types/props';

type LabHeaderProps = IsRTLProps & {
    selectedCategory: string;
    categoryNames: Record<string, Bilingual>;
};

export default function LabHeader({ selectedCategory, isRTL, categoryNames }: LabHeaderProps) {
    const { t, pick } = useTranslation(isRTL);
    const reduceMotion = useReducedMotion();

    return (
        <motion.header
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mb-10 md:mb-14"
        >
            <h1 className="text-[clamp(2.4rem,5.5vw,4.2rem)] font-light leading-[1.06] tracking-[-0.01em] text-star">
                {selectedCategory === "all"
                    ? t('common.allExperiments')
                    : pick(categoryNames[selectedCategory], selectedCategory)
                }
            </h1>
            <p className="mt-5 max-w-[38rem] text-[17px] leading-[1.7] text-dust md:text-[19px]">
                {t('lab.subtitle')}
            </p>
        </motion.header>
    );
}
