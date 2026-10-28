import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
import { headerItemClass } from './headerItemClass';
import { useTranslation } from '@/i18n';
import type { IsRTLProps } from '@/types/props';
import type { HeaderExperimentsProps } from '@/types/layout';
import type { LocalizedTexts } from '@/types/experiment';

export default function ExperimentsDropdown({ experiments, isRTL }: HeaderExperimentsProps & IsRTLProps) {
    const navigate = useNavigate();
    const location = useLocation();
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
                <Button variant="ghost" className={headerItemClass(location.pathname === createPageUrl("Lab"))}>
                    <span>{t('common.experiments')}</span>
                    <ChevronDown className="w-4 h-4 opacity-70" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={menuAlignStart}
                className="w-72 max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto border-line rounded-md"
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
                        <DropdownMenuLabel className="text-xs font-normal text-dust">
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
                                        className="flex items-center justify-between w-full cursor-pointer"
                                    >
                                        <span>{categoryLabel}</span>
                                        <span className="flex items-center gap-1 text-xs text-dust">
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
                                            className="ms-2 ps-2 pe-1 py-1 space-y-0.5 border-s border-line"
                                        >
                                            <DropdownMenuItem
                                                onSelect={() => navigate(createPageUrl(`Lab?category=${encodeURIComponent(category)}`))}
                                                className="text-xs text-blueshift cursor-pointer"
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
                                                        className="flex items-center gap-2 px-2 py-1.5 text-sm text-star/90 rounded cursor-pointer w-full"
                                                    >
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
