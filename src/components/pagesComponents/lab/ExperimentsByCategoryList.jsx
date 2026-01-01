import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import ExperimentCard from './ExperimentCard';

export default function ExperimentsByCategoryList({ 
    experimentsByCategory, 
    isRTL, 
    categoryIcons, 
    categoryNames 
}) {
    return (
        <motion.div
            key="categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {Object.entries(experimentsByCategory).map(([category, categoryExperiments], categoryIndex) => (
                <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.1 }}
                    className="mb-12"
                >
                    <div className="flex items-center space-x-4 rtl:space-x-reverse mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                            {React.createElement(categoryIcons[category] || BookOpen, { 
                                className: "w-6 h-6 text-white" 
                            })}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                {isRTL ? categoryNames[category]?.he : categoryNames[category]?.en}
                            </h2>
                            <p className="text-slate-500">
                                {categoryExperiments.length} {isRTL ? "ניסויים" : "experiments"}
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                </motion.div>
            ))}
        </motion.div>
    );
}