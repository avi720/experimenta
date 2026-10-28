import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3X3, BookOpen } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { LucideIcon } from 'lucide-react';
import type { Bilingual } from '@/types/experiment';
import type { IsRTLProps } from '@/types/props';

type LabFiltersProps = IsRTLProps & {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    selectedCategory: string;
    setSelectedCategory: (value: string) => void;
    experimentsByCategory: Record<string, unknown[]>;
    categoryIcons: Record<string, LucideIcon>;
    categoryNames: Record<string, Bilingual>;
};

const controlClass = 'h-11 rounded-md border-line bg-space text-[15px] text-star focus-visible:ring-blueshift focus:ring-blueshift';

export default function LabFilters({
    isRTL,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    experimentsByCategory,
    categoryIcons,
    categoryNames
}: LabFiltersProps) {
    const { t, pick } = useTranslation(isRTL);
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4, ease: 'easeOut' }}
            role="search"
            className="mb-12 md:mb-16 border border-line bg-space-raised p-3 sm:p-4"
        >
            <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dust" aria-hidden="true" />
                    <Input
                        type="search"
                        aria-label={t('lab.searchLabel')}
                        placeholder={t('lab.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`${controlClass} ps-10 placeholder:text-dust/80`}
                    />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className={`${controlClass} w-full md:w-72`} aria-label={t('lab.selectCategory')}>
                        <SelectValue placeholder={t('lab.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            <div className="flex items-center gap-2">
                                <Grid3X3 className="h-4 w-4 text-dust" aria-hidden="true" />
                                <span>{t('common.allCategories')}</span>
                            </div>
                        </SelectItem>
                        {Object.keys(experimentsByCategory).map(category => (
                            <SelectItem key={category} value={category}>
                                <div className="flex items-center gap-2">
                                    {React.createElement(categoryIcons[category] || BookOpen, { className: "h-4 w-4 text-dust", 'aria-hidden': true })}
                                    <span>{pick(categoryNames[category], category)}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </motion.div>
    );
}
