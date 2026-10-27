import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppSettings, ExperimentRun, ExperimentTemplate } from '@/entities/all';
import { appQueryKeys } from '@/lib/query-client';

// Single read path per table (T21). Every page shares these cached queries; writes go
// through the mutation hooks below, which invalidate the matching key on success.

export const DEFAULT_SETTINGS = { virtual_lab_enabled: true, locale_default: 'he' };

export function useAppSettingsQuery() {
    return useQuery({
        queryKey: appQueryKeys.settings,
        queryFn: async () => (await AppSettings.list())[0] || DEFAULT_SETTINGS,
        staleTime: 5 * 60 * 1000,
    });
}

// All templates readable by the current user (RLS hides inactive ones from non-admins).
export function useExperimentTemplatesQuery() {
    return useQuery({
        queryKey: appQueryKeys.experiments,
        queryFn: () => ExperimentTemplate.list(),
        staleTime: 60 * 1000,
    });
}

export function useExperimentTemplateQuery(id) {
    return useQuery({
        queryKey: [...appQueryKeys.experiments, id],
        queryFn: () => ExperimentTemplate.get(id),
        enabled: Boolean(id),
        retry: false,
    });
}

// RLS lets admins read every run; callers pass the current user's id to see only their own.
export function useExperimentRunsQuery(userId) {
    return useQuery({
        queryKey: [...appQueryKeys.runs, userId],
        queryFn: () => ExperimentRun.filter({ created_by: userId }, '-created_date'),
        enabled: Boolean(userId),
    });
}

function useInvalidatingMutation(mutationFn, queryKey) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });
}

export function useExperimentTemplateMutations() {
    const create = useInvalidatingMutation((data) => ExperimentTemplate.create(data), appQueryKeys.experiments);
    const update = useInvalidatingMutation(({ id, data }) => ExperimentTemplate.update(id, data), appQueryKeys.experiments);
    const remove = useInvalidatingMutation((id) => ExperimentTemplate.delete(id), appQueryKeys.experiments);
    return {
        createTemplate: create.mutateAsync,
        updateTemplate: (id, data) => update.mutateAsync({ id, data }),
        deleteTemplate: remove.mutateAsync,
    };
}

export function useExperimentRunMutations() {
    const create = useInvalidatingMutation((data) => ExperimentRun.create(data), appQueryKeys.runs);
    const remove = useInvalidatingMutation((id) => ExperimentRun.delete(id), appQueryKeys.runs);
    return {
        createRun: create.mutateAsync,
        deleteRun: remove.mutateAsync,
    };
}
