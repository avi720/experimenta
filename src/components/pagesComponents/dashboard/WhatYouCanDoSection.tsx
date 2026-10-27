import { Play, BarChart3, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import type { IsRTLProps } from '@/types/props';

type TextItem = { title?: string; description?: string };

const capabilityVisuals = [
    {
        icon: Play,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600"
    },
    {
        icon: BarChart3,
        iconBg: "bg-green-100",
        iconColor: "text-green-600"
    },
    {
        icon: BookOpen,
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600"
    }
];

export default function WhatYouCanDoSection({ isRTL }: IsRTLProps) {
    const { t } = useTranslation(isRTL);
    const items = t<TextItem[]>('dashboard.capabilities') || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-16"
        >
            <h2 className="text-4xl font-bold text-slate-900 mb-8">
                {t('dashboard.whatCanYouDoTitle')}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {capabilityVisuals.map((visual, index) => {
                    const item: TextItem = items[index] || {};
                    const Icon = visual.icon;
                    return (
                        <div key={index} className="bg-white rounded-2xl p-8 shadow-lg">
                            <div className={`w-16 h-16 ${visual.iconBg} rounded-full flex items-center justify-center mb-6 mx-auto`}>
                                <Icon className={`w-8 h-8 ${visual.iconColor}`} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">
                                {item.title}
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
