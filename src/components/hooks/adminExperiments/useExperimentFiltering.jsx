import { useMemo } from 'react';

export function useExperimentFiltering(
    experiments,
    searchTerm,
    selectedCategory,
    selectedEngine,
    showInactive,
    sortBy,
    sortDirection
) {
    const filteredExperiments = useMemo(() => {
        // Handle case where experiments is undefined or not an array
        if (!experiments || !Array.isArray(experiments)) {
            return [];
        }

        let filtered = [...experiments];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(exp =>
                (exp.i18n_texts?.he?.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (exp.i18n_texts?.en?.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (exp.slug?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (exp.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
            );
        }

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(exp => exp.category === selectedCategory);
        }

        // Apply engine filter
        if (selectedEngine !== 'all') {
            filtered = filtered.filter(exp => exp.engine === selectedEngine);
        }

        // Apply active/inactive filter
        if (!showInactive) {
            filtered = filtered.filter(exp => exp.is_active !== false);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let comparison = 0;
            
            if (sortBy === 'title') {
                const titleA = a.i18n_texts?.he?.title || a.slug || '';
                const titleB = b.i18n_texts?.he?.title || b.slug || '';
                comparison = titleA.localeCompare(titleB);
            } else if (sortBy === 'created_date' || sortBy === 'updated_date') {
                const dateA = new Date(a[sortBy]).getTime();
                const dateB = new Date(b[sortBy]).getTime();
                comparison = dateA - dateB;
            }
            
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [experiments, searchTerm, selectedCategory, selectedEngine, showInactive, sortBy, sortDirection]);

    const stats = useMemo(() => {
        // Initialize with default values
        const defaultStats = {
            total: 0,
            active: 0,
            inactive: 0,
            byCategory: {},
            byEngine: {}
        };

        if (!experiments || !Array.isArray(experiments) || experiments.length === 0) {
            return defaultStats;
        }

        const statsData = {
            total: experiments.length,
            active: experiments.filter(exp => exp.is_active !== false).length,
            inactive: experiments.filter(exp => exp.is_active === false).length,
            byCategory: {},
            byEngine: {}
        };

        experiments.forEach(exp => {
            // Count by category
            if (exp.category) {
                statsData.byCategory[exp.category] = (statsData.byCategory[exp.category] || 0) + 1;
            }

            // Count by engine
            if (exp.engine) {
                statsData.byEngine[exp.engine] = (statsData.byEngine[exp.engine] || 0) + 1;
            }
        });

        return statsData;
    }, [experiments]);

    return {
        filteredExperiments,
        stats
    };
}