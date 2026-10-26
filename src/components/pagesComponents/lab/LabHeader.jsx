import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';

export default function LabHeader({ selectedCategory, isRTL, categoryNames }) {
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
