import { useExperimentTemplatesQuery } from '@/hooks/useDataQueries';

export function useExperimentListFetching() {
    const { data, isPending } = useExperimentTemplatesQuery();

    return {
        experiments: Array.isArray(data) ? data : [],
        isLoading: isPending
    };
}
