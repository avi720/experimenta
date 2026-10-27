import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useExperimentTemplateQuery } from '@/hooks/useDataQueries';

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
    const isEditMode = Boolean(experimentId);

    const templateQuery = useExperimentTemplateQuery(experimentId);
    const loaded = templateQuery.data?.id ? templateQuery.data : null;

    // The form edits a local copy; it is (re)seeded whenever the target id or loaded row changes.
    const seedKey = isEditMode ? (loaded ? `edit:${loaded.id}` : null) : 'create';
    const [seededFor, setSeededFor] = useState(null);
    const [experiment, setExperiment] = useState(null);
    if (seedKey && seedKey !== seededFor) {
        setSeededFor(seedKey);
        setExperiment(isEditMode ? loaded : createEmptyExperiment());
    }

    const notFound = isEditMode && (templateQuery.isError || (templateQuery.isSuccess && !loaded));
    const isLoading = isEditMode ? templateQuery.isPending : seededFor !== 'create';

    return {
        experiment: notFound ? null : experiment,
        setExperiment,
        isLoading,
        isEditMode,
        notFound
    };
}
