import { Link } from 'react-router-dom';
import { BookOpen, Lock, Play } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/lib/AuthContext';
import { canAccessExperiment } from '@/lib/access';
import { cn } from '@/lib/utils';
import { categoryNames, getExperimentPageUrl } from './labConstants';
import { hasSimulation } from './experimentTraits';
import type { LucideIcon } from 'lucide-react';
import type { ExperimentTemplateData, LocalizedTexts } from '@/types/experiment';
import type { IsRTLProps } from '@/types/props';

type ExperimentCardProps = IsRTLProps & {
    experiment: ExperimentTemplateData;
    delay: number;
    categoryIcons: Record<string, LucideIcon>;
};

const pillClass = 'inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border text-[13px] leading-none';

export default function ExperimentCard({ experiment, isRTL, delay, categoryIcons }: ExperimentCardProps) {
    const { t, pick } = useTranslation(isRTL);
    const { user } = useAuth();
    const reduceMotion = useReducedMotion();

    const CategoryIcon = (experiment.category && categoryIcons[experiment.category]) || BookOpen;
    const texts = pick<LocalizedTexts>(experiment.i18n_texts);
    const title = texts?.title || experiment.slug;
    const categoryLabel = experiment.category ? pick(categoryNames[experiment.category], experiment.category) : null;
    const ready = hasSimulation(experiment);
    const accessLevel = experiment.access_level ?? 'public';
    const locked = !canAccessExperiment(user, experiment);
    const visibleTags = (experiment.tags ?? []).slice(0, 3);

    const body = (
        <>
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5 text-[13px] text-dust">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-line bg-space">
                        <CategoryIcon className="h-4 w-4 text-dust transition-colors group-hover:text-blueshift" aria-hidden="true" />
                    </span>
                    {categoryLabel && <span className="truncate">{categoryLabel}</span>}
                </div>

                <div className="flex flex-shrink-0 flex-wrap justify-end gap-1.5">
                    {accessLevel === 'premium' && (
                        <span className={cn(pillClass, 'border-plasma/40 bg-plasma/10 text-plasma')}>
                            {t('lab.accessPremium')}
                        </span>
                    )}
                    {accessLevel === 'registered' && (
                        <span className={cn(pillClass, 'border-line text-dust')}>
                            {t('lab.accessRegistered')}
                        </span>
                    )}
                </div>
            </div>

            <h3 className="mt-6 text-[22px] font-normal leading-snug text-star">{title}</h3>

            {texts?.short_desc && (
                <p className="mt-3 text-[15px] leading-[1.7] text-dust line-clamp-3">{texts.short_desc}</p>
            )}

            {visibleTags.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-dust/80">
                    {visibleTags.map((tag) => (
                        <li key={tag} className="before:me-3 before:text-line before:content-['/'] first:before:hidden">
                            {tag}
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-auto pt-8">
                <div className="flex items-center justify-between gap-3 border-t border-line pt-4 text-[15px]">
                    {!ready ? (
                        <span className="flex flex-col gap-1">
                            <span className="text-star">{t('lab.comingSoon')}</span>
                            <span className="text-[13px] text-dust">{t('lab.comingSoonNote')}</span>
                        </span>
                    ) : locked ? (
                        <span className="inline-flex items-center gap-2 text-dust">
                            <Lock className="h-4 w-4" aria-hidden="true" />
                            {accessLevel === 'premium' ? t('lab.lockedPremium') : t('lab.lockedRegistered')}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-2 font-medium text-plasma transition-colors group-hover:text-plasma-hi">
                            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                            {t('lab.openExperiment')}
                        </span>
                    )}
                </div>
            </div>
        </>
    );

    const surfaceClass = 'relative flex h-full flex-col border border-line bg-space p-6 sm:p-7';

    return (
        <motion.div
            className="h-full"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.35, ease: 'easeOut' }}
        >
            {ready ? (
                <Link
                    to={getExperimentPageUrl(experiment.slug)}
                    state={{ experiment }}
                    className={cn(surfaceClass, 'group focus-ring transition-colors hover:border-dust/40 hover:bg-space-raised')}
                >
                    {body}
                </Link>
            ) : (
                <article className={cn(surfaceClass, 'border-dashed')} aria-disabled="true">
                    {body}
                </article>
            )}
        </motion.div>
    );
}
