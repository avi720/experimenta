import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useExperimentTemplateQuery } from '@/hooks/useDataQueries';
import { asTemplateData } from '../experimentTemplateData';
import type { ExperimentFormData } from '@/types/experiment';

// Helper function to create an empty experiment object with valid defaults (T32)
export const createEmptyExperiment = (): ExperimentFormData => ({
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
    const loaded = templateQuery.data?.id ? asTemplateData(templateQuery.data) : null;

    // The form edits a local copy; it is (re)seeded whenever the target id or loaded row changes.
    const seedKey = isEditMode ? (loaded ? `edit:${loaded.id}` : null) : 'create';
    const [seededFor, setSeededFor] = useState<string | null>(null);
    const [experiment, setExperiment] = useState<ExperimentFormData | null>(null);
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
