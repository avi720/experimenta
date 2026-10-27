import { useState } from 'react';
import { useExperimentListFetching } from './adminExperiments/useExperimentListFetching';
import { useExperimentFiltering } from './adminExperiments/useExperimentFiltering';
import { useExperimentActions } from './adminExperiments/useExperimentActions';

export function useAdminExperiments() {
    const { experiments, isLoading } = useExperimentListFetching();
    
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [showInactive, setShowInactive] = useState(false);
    const [sortBy, setSortBy] = useState("created_date");
    const [sortDirection, setSortDirection] = useState("desc");
    
    const { filteredExperiments, stats } = useExperimentFiltering(
        experiments,
        searchTerm,
        selectedCategory,
        showInactive,
        sortBy,
        sortDirection
    );
    
    const { handleDelete, handleDuplicate, toggleActive, exportExperiments } = useExperimentActions(filteredExperiments);

    return {
        filteredExperiments,
        isLoading,
        stats,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        showInactive,
        setShowInactive,
        sortBy,
        setSortBy,
        sortDirection,
        setSortDirection,
        handleDelete,
        handleDuplicate,
        toggleActive,
        exportExperiments
    };
}
