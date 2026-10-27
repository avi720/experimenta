import { motion } from 'framer-motion';
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
    return (
        <motion.div
            key="filtered"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {filteredExperiments.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredExperiments.map((experiment, index) => (
                        <ExperimentCard 
                            key={experiment.id} 
                            experiment={experiment} 
                            isRTL={isRTL} 
                            delay={index * 0.1}
                            categoryIcons={categoryIcons}
                        />
                    ))}
                </div>
            ) : (
                <NoExperimentsFound isRTL={isRTL} />
            )}
        </motion.div>
    );
}