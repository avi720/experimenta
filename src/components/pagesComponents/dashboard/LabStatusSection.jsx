import React from 'react';
import { Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LabStatusSection({ settings, isRTL }) {
    // Only render if lab is not enabled
    if (settings?.virtual_lab_enabled) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-12 text-center"
        >
            <Lightbulb className="w-20 h-20 text-amber-600 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-amber-900 mb-4">
                {isRTL ? "המעבדה בבנייה" : "Lab Under Construction"}
            </h3>
            <p className="text-amber-700 text-xl max-w-2xl mx-auto leading-relaxed">
                {isRTL 
                    ? "אנחנו עובדים קשה כדי להביא לכם את המעבדה הווירטואלית הטובה ביותר. המעבדה תהיה זמינה בקרוב עם כל הניסויים המתקדמים."
                    : "We're working hard to bring you the best virtual laboratory. The lab will be available soon with all the advanced experiments."
                }
            </p>
        </motion.div>
    );
}