import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Atom, Waves, Zap, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import type { IsRTLProps } from '@/types/props';

type TextItem = { title?: string; description?: string };

const featureVisuals = [
    {
        icon: Zap,
        colors: "from-blue-50 to-cyan-50",
        iconBg: "bg-blue-500",
        delay: 0.1
    },
    {
        icon: Waves,
        colors: "from-purple-50 to-pink-50",
        iconBg: "bg-purple-500",
        delay: 0.2
    },
    {
        icon: Atom,
        colors: "from-green-50 to-emerald-50",
        iconBg: "bg-green-500",
        delay: 0.3
    },
    {
        icon: BarChart3,
        colors: "from-orange-50 to-red-50",
        iconBg: "bg-orange-500",
        delay: 0.4
    }
];

export default function FeaturesGrid({ isRTL }: IsRTLProps) {
    const { t } = useTranslation(isRTL);
    const items = t<TextItem[]>('dashboard.features') || [];

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {featureVisuals.map((visual, index) => {
                const item: TextItem = items[index] || {};
                const Icon = visual.icon;
                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: visual.delay }}
                    >
                        <Card className={`h-full border-0 shadow-xl bg-gradient-to-br ${visual.colors} hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
                            <CardHeader className="pb-4">
                                <div className={`w-16 h-16 ${visual.iconBg} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                                    <Icon className="w-8 h-8 text-white" />
                                </div>
                                <CardTitle className="text-xl text-slate-900 text-center">
                                    {item.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600 leading-relaxed text-center">
                                    {item.description}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}
