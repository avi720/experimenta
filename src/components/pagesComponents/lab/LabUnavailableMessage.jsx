import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LabUnavailableMessage({ isRTL }) {
    return (
        <div className="min-h-screen flex items-center justify-center px-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md text-center"
            >
                <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    {isRTL ? "המעבדה אינה זמינה" : "Lab Not Available"}
                </h2>
                <p className="text-slate-600 mb-6">
                    {isRTL 
                        ? "המעבדה הווירטואלית אינה מופעלת כעת. אנא פנו למנהל המערכת."
                        : "The virtual lab is not currently enabled. Please contact the system administrator."
                    }
                </p>
                <Link to={createPageUrl("Dashboard")}>
                    <Button variant="outline">
                        {isRTL ? "חזרה לדף הבית" : "Back to Home"}
                    </Button>
                </Link>
            </motion.div>
        </div>
    );
}