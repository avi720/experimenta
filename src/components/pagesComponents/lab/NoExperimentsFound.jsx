import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export default function NoExperimentsFound({ isRTL }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
        >
            <div className="w-20 h-20 bg-slate-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {isRTL ? "לא נמצאו ניסויים" : "No Experiments Found"}
            </h3>
            <p className="text-slate-600">
                {isRTL 
                    ? "נסו לשנות את הפילטרים או מונח החיפוש"
                    : "Try adjusting your filters or search terms"
                }
            </p>
        </motion.div>
    );
}