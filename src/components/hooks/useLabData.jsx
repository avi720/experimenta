import { useState, useEffect, useCallback, useMemo } from "react";
import { ExperimentTemplate} from "@/entities/all";

export function useLabData(searchTerm = "", selectedCategory = "all", isRTL) {
    const [experiments, setExperiments] = useState([]);
    const [isExperimentsLoading, setIsExperimentsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsExperimentsLoading(true);
        try {
            const experimentsList = await ExperimentTemplate.list();
            
            setExperiments(experimentsList.filter(exp => exp.is_active !== false));
        } catch (error) {
            console.error("Error loading lab data:", error);
            setExperiments([]);
        } finally {
            setIsExperimentsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
            const title = isRTL ? exp.i18n_texts?.he?.title : exp.i18n_texts?.en?.title;
            
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