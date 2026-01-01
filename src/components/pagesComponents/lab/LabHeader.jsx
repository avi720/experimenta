import React from 'react';
import { motion } from 'framer-motion';

export default function LabHeader({ selectedCategory, isRTL, categoryNames }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
        >
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
                {selectedCategory === "all" 
                    ? (isRTL ? "כל הניסויים" : "All Experiments")
                    : (isRTL ? categoryNames[selectedCategory]?.he : categoryNames[selectedCategory]?.en)
                }
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                {isRTL 
                    ? "בחרו ניסוי ותתחילו לחקור את עולם הפיזיקה"
                    : "Choose an experiment and start exploring the world of physics"
                }
            </p>
        </motion.div>
    );
}