import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Beaker, ChevronDown, ChevronRight } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
    categoryNames,
    getExperimentPageUrl,
    groupExperimentsByCategory,
} from '@/components/pagesComponents/lab/labConstants';
import { useTranslation } from '@/i18n';
import type { IsRTLProps } from '@/types/props';
import type { HeaderExperimentsProps } from '@/types/layout';
import type { LocalizedTexts } from '@/types/experiment';

export default function ExperimentsDropdown({ experiments, isRTL }: HeaderExperimentsProps & IsRTLProps) {
    const navigate = useNavigate();
    const { t, pick, dir, menuAlignStart } = useTranslation(isRTL);
    const experimentsByCategory = groupExperimentsByCategory(experiments);
    const categories = Object.entries(experimentsByCategory);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const expandKey = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const collapseKey = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';

    if (!experiments || experiments.length === 0) {
        return null;
    }

    const toggleCategory = (category: string) => {
        setExpandedCategory((prev) => (prev === category ? null : category));
    };

    return (
        <DropdownMenu onOpenChange={(open) => { if (!open) setExpandedCategory(null); }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3 sm:px-4 py-2 font-medium">
                    <Beaker className="w-5 h-5" />
                    <span>{t('common.experiments')}</span>
                    <ChevronDown className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={menuAlignStart}
                className="w-72 max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto"
                dir={dir}
            >
                <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Lab")} className="w-full cursor-pointer font-medium">
                        {t('common.allExperiments')}
                    </Link>
                </DropdownMenuItem>
                {categories.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
                            {t('common.categories')}
                        </DropdownMenuLabel>
                        {categories.map(([category, categoryExperiments]) => {
                            const isExpanded = expandedCategory === category;
                            const categoryLabel = pick(categoryNames[category], category);

                            return (
                                <div key={category} className="space-y-1">
                                    <DropdownMenuItem
                                        aria-expanded={isExpanded}
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            toggleCategory(category);
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === expandKey && !isExpanded) {
                                                event.preventDefault();
                                                toggleCategory(category);
                                            } else if (event.key === collapseKey && isExpanded) {
                                                event.preventDefault();
                                                toggleCategory(category);
                                            }
                                        }}
                                        className="flex items-center justify-between w-full cursor-pointer font-medium"
                                    >
                                        <span>{categoryLabel}</span>
                                        <span className="flex items-center gap-1 text-xs text-slate-400">
                                            <span>({categoryExperiments.length})</span>
                                            <ChevronRight
                                                className={`w-4 h-4 transition-transform rtl:rotate-180 ${
                                                    isExpanded ? 'rotate-90 rtl:rotate-90' : ''
                                                }`}
                                            />
                                        </span>
                                    </DropdownMenuItem>

                                    {isExpanded && (
                                        <div
                                            role="group"
                                            aria-label={categoryLabel}
                                            className="ps-3 pe-1 py-1 space-y-0.5 bg-slate-50 rounded-md border border-slate-100"
                                        >
                                            <DropdownMenuItem
                                                onSelect={() => navigate(createPageUrl(`Lab?category=${encodeURIComponent(category)}`))}
                                                className="text-xs text-blue-600 font-medium cursor-pointer"
                                            >
                                                {t('header.allInCategory', { category: categoryLabel })}
                                            </DropdownMenuItem>
                                            {categoryExperiments.map((experiment) => (
                                                <DropdownMenuItem
                                                    key={experiment.id || experiment.slug}
                                                    asChild
                                                >
                                                    <Link
                                                        to={getExperimentPageUrl(experiment.slug)}
                                                        state={{ experiment }}
                                                        className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded cursor-pointer w-full"
                                                    >
                                                        <Beaker className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                                        <span className="flex-1 truncate">
                                                            {pick<LocalizedTexts>(experiment.i18n_texts)?.title || experiment.slug}
                                                        </span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
