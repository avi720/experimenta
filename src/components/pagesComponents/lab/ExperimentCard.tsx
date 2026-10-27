import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import { getExperimentPageUrl } from './labConstants';
import type { LucideIcon } from 'lucide-react';
import type { ExperimentTemplateData, LocalizedTexts } from '@/types/experiment';
import type { IsRTLProps } from '@/types/props';

type ExperimentCardProps = IsRTLProps & {
    experiment: ExperimentTemplateData;
    delay: number;
    categoryIcons: Record<string, LucideIcon>;
};

export default function ExperimentCard({ experiment, isRTL, delay, categoryIcons }: ExperimentCardProps) {
    const { t, pick } = useTranslation(isRTL);
    const CategoryIcon = (experiment.category && categoryIcons[experiment.category]) || BookOpen;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm overflow-hidden group">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <CategoryIcon className="w-6 h-6 text-white" />
                        </div>
                        <Badge variant="secondary">
                            {experiment.category}
                        </Badge>
                    </div>

                    <CardTitle className="text-xl leading-tight group-hover:text-blue-600 transition-colors">
                        {pick<LocalizedTexts>(experiment.i18n_texts)?.title || experiment.slug}
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                    {/* Tags */}
                    {experiment.tags && experiment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {experiment.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs bg-slate-50">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-auto">
                        <Link
                            to={getExperimentPageUrl(experiment.slug)}
                            state={{ experiment }}
                            className="block"
                        >
                            <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 gap-2">
                                <Play className="w-5 h-5" />
                                {t('lab.startExperiment')}
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
