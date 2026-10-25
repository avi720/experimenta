import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Beaker, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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

export default function ExperimentsDropdown({ experiments, isRTL }) {
    const navigate = useNavigate();
    const experimentsByCategory = groupExperimentsByCategory(experiments);
    const categories = Object.entries(experimentsByCategory);
    const [expandedCategory, setExpandedCategory] = useState(null);

    if (!experiments || experiments.length === 0) {
        return null;
    }

    const toggleCategory = (category) => {
        setExpandedCategory((prev) => (prev === category ? null : category));
    };

    const CategoryChevron = isRTL ? ChevronLeft : ChevronRight;

    return (
        <DropdownMenu onOpenChange={(open) => { if (!open) setExpandedCategory(null); }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3 sm:px-4 py-2 font-medium">
                    <Beaker className="w-5 h-5" />
                    <span>{isRTL ? "ניסויים" : "Experiments"}</span>
                    <ChevronDown className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={isRTL ? "end" : "start"}
                className="w-72 max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto"
                dir={isRTL ? "rtl" : "ltr"}
            >
                <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Lab")} className="w-full cursor-pointer font-medium">
                        {isRTL ? "כל הניסויים" : "All Experiments"}
                    </Link>
                </DropdownMenuItem>
                {categories.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
                            {isRTL ? "קטגוריות" : "Categories"}
                        </DropdownMenuLabel>
                        {categories.map(([category, categoryExperiments]) => {
                            const isExpanded = expandedCategory === category;
                            const categoryLabel = isRTL
                                ? categoryNames[category]?.he || category
                                : categoryNames[category]?.en || category;

                            return (
                                <div key={category} className="space-y-1">
                                    <DropdownMenuItem
                                        aria-expanded={isExpanded}
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            toggleCategory(category);
                                        }}
                                        onKeyDown={(event) => {
                                            const expandKey = isRTL ? 'ArrowLeft' : 'ArrowRight';
                                            const collapseKey = isRTL ? 'ArrowRight' : 'ArrowLeft';
                                            if (event.key === expandKey) {
                                                event.preventDefault();
                                                setExpandedCategory(category);
                                            } else if (event.key === collapseKey && isExpanded) {
                                                event.preventDefault();
                                                setExpandedCategory(null);
                                            }
                                        }}
                                        className="flex items-center justify-between w-full cursor-pointer font-medium"
                                    >
                                        <span>{categoryLabel}</span>
                                        <span className="flex items-center gap-1 text-xs text-slate-400">
                                            <span>({categoryExperiments.length})</span>
                                            <CategoryChevron
                                                className={`w-4 h-4 transition-transform ${
                                                    isExpanded ? 'rotate-90 rtl:-rotate-90' : ''
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
                                                {isRTL ? `כל הניסויים ב${categoryLabel}` : `All in ${categoryLabel}`}
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
                                                            {isRTL
                                                                ? experiment.i18n_texts?.he?.title || experiment.slug
                                                                : experiment.i18n_texts?.en?.title || experiment.slug}
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
