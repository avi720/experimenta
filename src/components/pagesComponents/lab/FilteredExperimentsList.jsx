import React from 'react';
import { motion } from 'framer-motion';
import ExperimentCard from './ExperimentCard';
import NoExperimentsFound from './NoExperimentsFound';

export default function FilteredExperimentsList({ 
    filteredExperiments, 
    isRTL, 
    categoryIcons 
}) {
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