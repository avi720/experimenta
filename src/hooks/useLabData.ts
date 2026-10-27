import { useMemo } from "react";
import { useExperimentTemplatesQuery } from "@/hooks/useDataQueries";
import { matchesExperimentSearch } from "@/components/pagesComponents/lab/labConstants";
import { asTemplateDataList } from "./experimentTemplateData";
import type { ExperimentTemplateData } from "@/types/experiment";

export function useLabData(searchTerm = "", selectedCategory = "all", _isRTL?: boolean) {
    const experimentsQuery = useExperimentTemplatesQuery();
    const experiments = useMemo(
        () => asTemplateDataList(experimentsQuery.data ?? []).filter(exp => exp.is_active !== false),
        [experimentsQuery.data]
    );
    const isExperimentsLoading = experimentsQuery.isPending;

    // Group experiments by category
    const experimentsByCategory = useMemo(() => {
        return experiments.reduce<Record<string, ExperimentTemplateData[]>>((acc, exp) => {
            // A missing category groups under "null", as the plain object key always did.
            const category = String(exp.category);
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(exp);
            return acc;
        }, {});
    }, [experiments]);

    // Filter experiments based on search term and category
    const filteredExperiments = useMemo(() => {
        return experiments.filter(exp => {
            const matchesSearch = matchesExperimentSearch(exp, searchTerm);
            const matchesCategory = selectedCategory === "all" || exp.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [experiments, searchTerm, selectedCategory]);

    return {
        experiments,
        isExperimentsLoading,
        experimentsByCategory,
        filteredExperiments
    };
}
