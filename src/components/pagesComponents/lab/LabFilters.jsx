import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3X3, BookOpen } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function LabFilters({ 
    isRTL, 
    searchTerm, 
    setSearchTerm, 
    selectedCategory, 
    setSelectedCategory,
    experimentsByCategory,
    categoryIcons,
    categoryNames
}) {
    const { t, pick } = useTranslation(isRTL);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        placeholder={t('lab.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ps-10 h-12 text-lg border-slate-200"
                    />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-64 h-12">
                        <SelectValue placeholder={t('lab.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            <div className="flex items-center gap-2">
                                <Grid3X3 className="w-4 h-4" />
                                <span>{t('common.allCategories')}</span>
                            </div>
                        </SelectItem>
                        {Object.keys(experimentsByCategory).map(category => (
                            <SelectItem key={category} value={category}>
                                <div className="flex items-center gap-2">
                                    {React.createElement(categoryIcons[category] || BookOpen, { className: "w-4 h-4" })}
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
