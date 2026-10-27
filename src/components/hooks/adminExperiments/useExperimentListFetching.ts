import { useExperimentTemplatesQuery } from '@/hooks/useDataQueries';
import { asTemplateDataList } from '../experimentTemplateData';

export function useExperimentListFetching() {
    const { data, isPending } = useExperimentTemplatesQuery();

    return {
        experiments: Array.isArray(data) ? asTemplateDataList(data) : [],
        isLoading: isPending
    };
}
