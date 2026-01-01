import { useState, useEffect, useCallback } from 'react';
import { ExperimentTemplate } from '@/entities/all';

export function useExperimentListFetching() {
    const [experiments, setExperiments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadExperiments = useCallback(async () => {
        setIsLoading(true);
        try {
            const list = await ExperimentTemplate.list();
            setExperiments(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Error loading experiments:', error);
            setExperiments([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadExperiments();
    }, [loadExperiments]);

    return {
        experiments,
        isLoading,
        loadExperiments
    };
}