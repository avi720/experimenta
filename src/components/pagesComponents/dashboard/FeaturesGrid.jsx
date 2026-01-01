import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Atom, Waves, Zap, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
    {
        title_he: "מכניקה קלאסית",
        title_en: "Classical Mechanics",
        description_he: "נפילה חופשית, מתנדים הרמוניים ועוד תופעות מכניות בסיסיות",
        description_en: "Free fall, harmonic oscillators and other fundamental mechanical phenomena",
        icon: Zap,
        colors: "from-blue-50 to-cyan-50",
        iconBg: "bg-blue-500",
        delay: 0.1
    },
    {
        title_he: "גלים ואופטיקה",
        title_en: "Waves & Optics",
        description_he: "התאבכות, עקיפה והתנהגות גלים במדיומים שונים",
        description_en: "Interference, diffraction and wave behavior in different media",
        icon: Waves,
        colors: "from-purple-50 to-pink-50",
        iconBg: "bg-purple-500",
        delay: 0.2
    },
    {
        title_he: "פיזיקה קוונטית",
        title_en: "Quantum Physics",
        description_he: "מנהור קוונטי, פונקציות גל ותופעות מכניקה קוונטית",
        description_en: "Quantum tunneling, wave functions and quantum mechanical phenomena",
        icon: Atom,
        colors: "from-green-50 to-emerald-50",
        iconBg: "bg-green-500",
        delay: 0.3
    },
    {
        title_he: "ניתוח נתונים",
        title_en: "Data Analysis",
        description_he: "גרפים דינמיים, מדידות מדויקות וייצוא נתונים",
        description_en: "Dynamic charts, precise measurements and data export",
        icon: BarChart3,
        colors: "from-orange-50 to-red-50",
        iconBg: "bg-orange-500",
        delay: 0.4
    }
];

export default function FeaturesGrid({ isRTL }) {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {features.map((feature, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: feature.delay }}
                >
                    <Card className={`h-full border-0 shadow-xl bg-gradient-to-br ${feature.colors} hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
                        <CardHeader className="pb-4">
                            <div className={`w-16 h-16 ${feature.iconBg} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                                <feature.icon className="w-8 h-8 text-white" />
                            </div>
                            <CardTitle className="text-xl text-slate-900 text-center">
                                {isRTL ? feature.title_he : feature.title_en}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 leading-relaxed text-center">
                                {isRTL ? feature.description_he : feature.description_en}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}