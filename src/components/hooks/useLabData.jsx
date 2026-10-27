import { useMemo } from "react";
import { pickLocalized } from "@/i18n";
import { useExperimentTemplatesQuery } from "@/hooks/useDataQueries";

export function useLabData(searchTerm = "", selectedCategory = "all", isRTL) {
    const experimentsQuery = useExperimentTemplatesQuery();
    const experiments = useMemo(
        () => (experimentsQuery.data ?? []).filter(exp => exp.is_active !== false),
        [experimentsQuery.data]
    );
    const isExperimentsLoading = experimentsQuery.isPending;

    // Group experiments by category
    const experimentsByCategory = useMemo(() => {
        return experiments.reduce((acc, exp) => {
            if (!acc[exp.category]) {
                acc[exp.category] = [];
            }
            acc[exp.category].push(exp);
            return acc;
        }, {});
    }, [experiments]);

    // Filter experiments based on search term and category
    const filteredExperiments = useMemo(() => {
        return experiments.filter(exp => {
            const title = pickLocalized(exp.i18n_texts, isRTL)?.title;
            
            const matchesSearch = !searchTerm || 
                (title && title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (exp.tags && exp.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
            
            const matchesCategory = selectedCategory === "all" || exp.category === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });
    }, [experiments, searchTerm, selectedCategory, isRTL]);

    return {
        experiments,
        isExperimentsLoading,
        experimentsByCategory,
        filteredExperiments
    };
}
