import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import ExperimentCard from './ExperimentCard';
import NoExperimentsFound from './NoExperimentsFound';
import type { LucideIcon } from 'lucide-react';
import type { ExperimentTemplateData } from '@/types/experiment';
import type { IsRTLProps } from '@/types/props';

type FilteredExperimentsListProps = IsRTLProps & {
    filteredExperiments: ExperimentTemplateData[];
    categoryIcons: Record<string, LucideIcon>;
};

export default function FilteredExperimentsList({
    filteredExperiments,
    isRTL,
    categoryIcons
}: FilteredExperimentsListProps) {
    const { t } = useTranslation(isRTL);

    return (
        <motion.div
            key="filtered"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {filteredExperiments.length > 0 ? (
                <>
                    <p className="mb-6 text-[13px] text-dust" aria-live="polite">
                        <span className="font-mono text-star">{filteredExperiments.length}</span> {t('lab.experimentsCountLabel')}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredExperiments.map((experiment, index) => (
                            <ExperimentCard
                                key={experiment.id}
                                experiment={experiment}
                                isRTL={isRTL}
                                delay={index * 0.05}
                                categoryIcons={categoryIcons}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <NoExperimentsFound isRTL={isRTL} />
            )}
        </motion.div>
    );
}
