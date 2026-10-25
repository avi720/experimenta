import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExperimentTemplate } from '@/entities/all';

// Helper function to create an empty experiment object with valid defaults (T32)
export const createEmptyExperiment = () => ({
    slug: '',
    category: 'ClassicalMechanics',
    visualization_type: '3d',
    access_level: 'public',
    engine: 'classicalMechanics',
    parameters: [],
    outputs: [],
    presets: [],
    i18n_texts: {
        he: { title: '', short_desc: '', steps: [], safety_notes: '' },
        en: { title: '', short_desc: '', steps: [], safety_notes: '' }
    },
    thumbnail_url: '',
    tags: [],
    is_active: true
});

export function useExperimentDataLoading() {
    const [searchParams] = useSearchParams();
    const experimentId = searchParams.get('id');

    const [experiment, setExperiment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(Boolean(experimentId));
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadExperiment = async () => {
            setIsLoading(true);
            setNotFound(false);

            if (experimentId) {
                setIsEditMode(true);
                try {
                    const foundExperiment = await ExperimentTemplate.get(experimentId);
                    if (cancelled) return;

                    if (foundExperiment && foundExperiment.id) {
                        setExperiment(foundExperiment);
                    } else {
                        setExperiment(null);
                        setNotFound(true);
                    }
                } catch (error) {
                    if (cancelled) return;
                    console.error('useExperimentDataLoading - Experiment not found or failed to load:', error);
                    setExperiment(null);
                    setNotFound(true);
                }
            } else {
                setIsEditMode(false);
                setExperiment(createEmptyExperiment());
            }

            if (!cancelled) {
                setIsLoading(false);
            }
        };

        loadExperiment();

        return () => {
            cancelled = true;
        };
    }, [experimentId]);

    return {
        experiment,
        setExperiment,
        isLoading,
        isEditMode,
        notFound
    };
}
