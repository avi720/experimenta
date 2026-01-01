import { useState } from 'react';
import { useExperimentListFetching } from './useExperimentListFetching';
import { useExperimentFiltering } from './useExperimentFiltering';
import { useExperimentActions } from './useExperimentActions';

export function useAdminExperiments() {
    const { experiments, isLoading, loadExperiments } = useExperimentListFetching();
    
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedEngine, setSelectedEngine] = useState("all");
    const [showInactive, setShowInactive] = useState(false);
    const [sortBy, setSortBy] = useState("created_date");
    const [sortDirection, setSortDirection] = useState("desc");
    
    const { filteredExperiments = [], stats = { total: 0, active: 0, inactive: 0, byCategory: {}, byEngine: {} } } = useExperimentFiltering(
        experiments,
        searchTerm,
        selectedCategory,
        selectedEngine,
        showInactive,
        sortBy,
        sortDirection
    ) || {};
    
    const { handleDelete, handleDuplicate, toggleActive, exportExperiments } = useExperimentActions(
        loadExperiments,
        filteredExperiments
    );

    return {
        filteredExperiments,
        isLoading,
        stats,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        selectedEngine,
        setSelectedEngine,
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