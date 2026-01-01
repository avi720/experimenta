import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, Trash } from 'lucide-react';

export default function AdminExperimentsFilters({
  searchTerm, setSearchTerm,
  selectedCategory, setSelectedCategory,
  //selectedEngine, setSelectedEngine,
  sortBy, sortDirection, handleSortChange,
  showInactive, setShowInactive,
  stats,
  categoryNames, //engineNames,
  activeFiltersCount,
  clearFilters
}) {
  return (
    <motion.div
      layout
      className="bg-white rounded-lg shadow-sm p-4 mb-8 border border-slate-200"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="חיפוש לפי שם, תגית או slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-4 pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger><SelectValue placeholder="סינון לפי קטגוריה" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {Object.entries(categoryNames).map(([key, { he }]) => (
              <SelectItem key={key} value={key}>{he} ({stats.byCategory[key] || 0})</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/*<Select value={selectedEngine} onValueChange={setSelectedEngine}>
          <SelectTrigger><SelectValue placeholder="סינון לפי מנוע" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל המנועים</SelectItem>
            {Object.entries(engineNames).map(([key, { he }]) => (
              <SelectItem key={key} value={key}>{he} ({stats.byEngine[key] || 0})</SelectItem>
            ))}
          </SelectContent>
        </Select>*/}
        
        <Select value={`${sortBy}-${sortDirection}`} onValueChange={handleSortChange}>
          <SelectTrigger><SelectValue placeholder="מיון לפי" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="created_date-desc">תאריך יצירה (חדש לישן)</SelectItem>
            <SelectItem value="created_date-asc">תאריך יצירה (ישן לחדש)</SelectItem>
            <SelectItem value="updated_date-desc">תאריך עדכון (אחרון)</SelectItem>
            <SelectItem value="title-asc">שם (א-ת)</SelectItem>
            <SelectItem value="title-desc">שם (ת-א)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
          <Label htmlFor="show-inactive">הצג ניסויים לא פעילים</Label>
        </div>
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-2">
              <SlidersHorizontal className="w-3 h-3" />
              {activeFiltersCount} פילטרים פעילים
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-slate-800">
              <Trash className="w-3 h-3 ml-1" />
              נקה הכל
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}