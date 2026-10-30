import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useTranslation } from '@/i18n';
import ExperimentCard from './ExperimentCard';
import type { LucideIcon } from 'lucide-react';
import type { Bilingual, ExperimentTemplateData } from '@/types/experiment';
import type { IsRTLProps } from '@/types/props';

type ExperimentsByCategoryListProps = IsRTLProps & {
    experimentsByCategory: Record<string, ExperimentTemplateData[]>;
    categoryIcons: Record<string, LucideIcon>;
    categoryNames: Record<string, Bilingual>;
};

export default function ExperimentsByCategoryList({
    experimentsByCategory,
    isRTL,
    categoryIcons,
    categoryNames
}: ExperimentsByCategoryListProps) {
    const { t, pick } = useTranslation(isRTL);

    return (
        <motion.div
            key="categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-16 md:space-y-24"
        >
            {Object.entries(experimentsByCategory).map(([category, categoryExperiments]) => {
                const headingId = `lab-category-${category.replace(/\W+/g, '-')}`;
                return (
                    <section key={category} aria-labelledby={headingId}>
                        <div className="mb-8 flex items-end justify-between gap-4 border-b border-line pb-4">
                            <div className="flex items-center gap-4">
                                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-line bg-space-raised">
                                    {React.createElement(categoryIcons[category] || BookOpen, {
                                        className: "h-5 w-5 text-blueshift",
                                        'aria-hidden': true,
                                    })}
                                </span>
                                <h2 id={headingId} className="text-[clamp(1.6rem,3vw,2.1rem)] font-light leading-[1.12] text-star">
                                    {pick(categoryNames[category], category)}
                                </h2>
                            </div>
                            <p className="flex-shrink-0 text-[13px] text-dust">
                                <span className="font-mono text-star">{categoryExperiments.length}</span> {t('lab.experimentsCountLabel')}
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {categoryExperiments.map((experiment, index) => (
                                <ExperimentCard
                                    key={experiment.id}
                                    experiment={experiment}
                                    isRTL={isRTL}
                                    delay={index * 0.05}
                                    categoryIcons={categoryIcons}
                                />
                            ))}
                        </div>
                    </section>
                );
            })}
        </motion.div>
    );
}
