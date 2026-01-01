import React from 'react';
import { Play, BarChart3, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const capabilities = [
    {
        title_he: "התנסו בזמן אמת",
        title_en: "Real-Time Experimentation",
        description_he: "שנו פרמטרים ברגע וראו איך זה משפיע על התוצאות. למדו דרך ניסוי וטעייה בסביבה בטוחה.",
        description_en: "Change parameters instantly and see how it affects results. Learn through trial and error in a safe environment.",
        icon: Play,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600"
    },
    {
        title_he: "מדדו ונתחו",
        title_en: "Measure & Analyze",
        description_he: "צפו בגרפים חיים, מדדו ערכים במדויק ויצאו נתונים לעיבוד נוסף במחשב.",
        description_en: "View live charts, measure values precisely and export data for further computer processing.",
        icon: BarChart3,
        iconBg: "bg-green-100",
        iconColor: "text-green-600"
    },
    {
        title_he: "למדו והבינו",
        title_en: "Learn & Understand", 
        description_he: "קבלו הסברים מפורטים, עקבו אחר התהליכים והבינו את העקרונות הפיזיקליים.",
        description_en: "Get detailed explanations, follow processes and understand the physical principles.",
        icon: BookOpen,
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600"
    }
];

export default function WhatYouCanDoSection({ isRTL }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-16"
        >
            <h2 className="text-4xl font-bold text-slate-900 mb-8">
                {isRTL ? "מה תוכלו לעשות?" : "What Can You Do?"}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {capabilities.map((capability, index) => (
                    <div key={index} className="bg-white rounded-2xl p-8 shadow-lg">
                        <div className={`w-16 h-16 ${capability.iconBg} rounded-full flex items-center justify-center mb-6 mx-auto`}>
                            <capability.icon className={`w-8 h-8 ${capability.iconColor}`} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">
                            {isRTL ? capability.title_he : capability.title_en}
                        </h3>
                        <p className="text-slate-600 leading-relaxed">
                            {isRTL ? capability.description_he : capability.description_en}
                        </p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}