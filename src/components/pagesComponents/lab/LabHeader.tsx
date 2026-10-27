import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import type { Bilingual } from '@/types/experiment';
import type { IsRTLProps } from '@/types/props';

type LabHeaderProps = IsRTLProps & {
    selectedCategory: string;
    categoryNames: Record<string, Bilingual>;
};

export default function LabHeader({ selectedCategory, isRTL, categoryNames }: LabHeaderProps) {
    const { t, pick } = useTranslation(isRTL);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
        >
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
                {selectedCategory === "all" 
                    ? t('common.allExperiments')
                    : pick(categoryNames[selectedCategory], selectedCategory)
                }
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                {t('lab.subtitle')}
            </p>
        </motion.div>
    );
}
