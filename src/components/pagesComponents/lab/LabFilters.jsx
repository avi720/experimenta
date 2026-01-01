import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3X3, BookOpen } from 'lucide-react';

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
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400`} />
                    <Input
                        placeholder={isRTL ? "חפש ניסויים..." : "Search experiments..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`${isRTL ? 'pr-10' : 'pl-10'} h-12 text-lg border-slate-200`}
                    />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-64 h-12">
                        <SelectValue placeholder={isRTL ? "בחר קטגוריה" : "Select Category"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <Grid3X3 className="w-4 h-4" />
                                <span>{isRTL ? "כל הקטגוריות" : "All Categories"}</span>
                            </div>
                        </SelectItem>
                        {Object.keys(experimentsByCategory).map(category => (
                            <SelectItem key={category} value={category}>
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                    {React.createElement(categoryIcons[category] || BookOpen, { className: "w-4 h-4" })}
                                    <span>{isRTL ? categoryNames[category]?.he : categoryNames[category]?.en}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </motion.div>
    );
}