
import { useState, useEffect } from 'react';
import { ExperimentTemplate } from '@/entities/all';

// Helper function to create an empty experiment object
const createEmptyExperiment = () => ({
    slug: '',
    category: 'Classical',
    visualization_type: '3d',
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
    const [experiment, setExperiment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        const loadExperiment = async () => {
            setIsLoading(true);

            // Get ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const experimentId = urlParams.get('id');

            console.log(`📋 useExperimentDataLoading - URL params:`, window.location.search);
            console.log(`📋 useExperimentDataLoading - Extracted ID:`, experimentId);

            if (experimentId) {
                console.log(`📋 useExperimentDataLoading - Edit mode detected, loading experiment ID: ${experimentId}`);
                setIsEditMode(true);
                try {
                    // Fetch all experiments and find the one with the matching ID
                    // NOTE: This assumes ExperimentTemplate.list() returns items with an 'id' field
                    const experiments = await ExperimentTemplate.list();
                    const foundExperiment = experiments.find(exp => exp.id === experimentId);

                    console.log(`📋 useExperimentDataLoading - Found experiment:`, foundExperiment ? 'Yes' : 'No');

                    if (foundExperiment) {
                        setExperiment(foundExperiment);
                    } else {
                        console.error(`❌ useExperimentDataLoading - Experiment with ID ${experimentId} not found`);
                        // Optionally, navigate to an error page or creation page
                        setExperiment(createEmptyExperiment()); // Fallback to empty if not found
                        setIsEditMode(false);
                    }
                } catch (error) {
                    console.error('❌ useExperimentDataLoading - Error loading experiment:', error);
                    setExperiment(createEmptyExperiment()); // Fallback to empty on error
                    setIsEditMode(false);
                }
            } else {
                console.log(`📋 useExperimentDataLoading - Create mode (no ID in URL)`);
                setIsEditMode(false);
                setExperiment(createEmptyExperiment());
            }

            setIsLoading(false);
        };

        loadExperiment();
    }, []); // Empty dependency array means this effect runs once on mount

    return {
        experiment,
        setExperiment,
        isLoading,
        isEditMode
    };
}
