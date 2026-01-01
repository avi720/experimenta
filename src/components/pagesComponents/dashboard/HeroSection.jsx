import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Beaker } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection({ settings, isRTL }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
        >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-2xl">
                <Beaker className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                {isRTL ? "מעבדת הפיזיקה הווירטואלית" : "Virtual Physics Laboratory"}
            </h1>
            <p className="text-2xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                {isRTL 
                    ? "גלו את חוקי הפיזיקה דרך סימולציות אינטראקטיביות מתקדמות. למדו, התנסו וחקרו בסביבה וירטואלית בטוחה ומתקדמת."
                    : "Discover the laws of physics through advanced interactive simulations. Learn, experiment and explore in a safe and advanced virtual environment."
                }
            </p>
            
            {settings?.virtual_lab_enabled ? (
                <Link to={createPageUrl("Lab")}>
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg">
                        <Beaker className="w-6 h-6 mr-3" />
                        {isRTL ? "התחילו לחקור" : "Start Exploring"}
                    </Button>
                </Link>
            ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 px-6 py-2 text-lg">
                    {isRTL ? "המעבדה תהיה זמינה בקרוב" : "Lab Coming Soon"}
                </Badge>
            )}
        </motion.div>
    );
}