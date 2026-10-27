import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Beaker } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import type { AppSettings } from '@/types/models';
import type { IsRTLProps } from '@/types/props';

type HeroSectionProps = IsRTLProps & { settings: AppSettings | null };

export default function HeroSection({ settings, isRTL }: HeroSectionProps) {
    const { t } = useTranslation(isRTL);

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
                {t('dashboard.heroTitle')}
            </h1>
            <p className="text-2xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                {t('dashboard.heroSubtitle')}
            </p>
            
            {settings?.virtual_lab_enabled ? (
                <Link to={createPageUrl("Lab")}>
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg gap-3">
                        <Beaker className="w-6 h-6" />
                        {t('dashboard.startExploring')}
                    </Button>
                </Link>
            ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 px-6 py-2 text-lg">
                    {t('dashboard.labComingSoon')}
                </Badge>
            )}
        </motion.div>
    );
}
