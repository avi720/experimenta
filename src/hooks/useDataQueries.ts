import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { AppSettings, ExperimentRun, ExperimentTemplate } from '@/entities/all';
import { appQueryKeys } from '@/lib/query-client';
import type { AppSettings as AppSettingsData, InsertRow, UpdateRow } from '@/types/models';

// Single read path per table (T21). Every page shares these cached queries; writes go
// through the mutation hooks below, which invalidate the matching key on success.

export const DEFAULT_SETTINGS: AppSettingsData = { virtual_lab_enabled: true, locale_default: 'he' };

export function useAppSettingsQuery() {
    return useQuery({
        queryKey: appQueryKeys.settings,
        queryFn: async (): Promise<AppSettingsData> => (await AppSettings.list())[0] || DEFAULT_SETTINGS,
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

export function useExperimentTemplateQuery(id: string | null | undefined) {
    return useQuery({
        queryKey: [...appQueryKeys.experiments, id],
        queryFn: () => ExperimentTemplate.get(id as string),
        enabled: Boolean(id),
        retry: false,
    });
}

// RLS lets admins read every run; callers pass the current user's id to see only their own.
export function useExperimentRunsQuery(userId: string | null | undefined) {
    return useQuery({
        queryKey: [...appQueryKeys.runs, userId],
        queryFn: () => ExperimentRun.filter({ created_by: userId as string }, '-created_date'),
        enabled: Boolean(userId),
    });
}

function useInvalidatingMutation<TVariables, TResult>(
    mutationFn: (variables: TVariables) => Promise<TResult>,
    queryKey: QueryKey
) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });
}

export function useExperimentTemplateMutations() {
    const create = useInvalidatingMutation(
        (data: InsertRow<'experiment_templates'>) => ExperimentTemplate.create(data),
        appQueryKeys.experiments
    );
    const update = useInvalidatingMutation(
        ({ id, data }: { id: string; data: UpdateRow<'experiment_templates'> }) => ExperimentTemplate.update(id, data),
        appQueryKeys.experiments
    );
    const remove = useInvalidatingMutation((id: string) => ExperimentTemplate.delete(id), appQueryKeys.experiments);
    return {
        createTemplate: create.mutateAsync,
        updateTemplate: (id: string, data: UpdateRow<'experiment_templates'>) => update.mutateAsync({ id, data }),
        deleteTemplate: remove.mutateAsync,
    };
}

export function useExperimentRunMutations() {
    const create = useInvalidatingMutation((data: InsertRow<'experiment_runs'>) => ExperimentRun.create(data), appQueryKeys.runs);
    const remove = useInvalidatingMutation((id: string) => ExperimentRun.delete(id), appQueryKeys.runs);
    return {
        createRun: create.mutateAsync,
        deleteRun: remove.mutateAsync,
    };
}
