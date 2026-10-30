import { useCallback } from 'react';
import { toast } from 'sonner';
import { useExperimentRunMutations } from '@/hooks/useDataQueries';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/i18n';
import { downloadCsv } from '@/lib/csv';
import { exportWorkspaceCsv, serializeSimulationSamples } from '@/lib/simulationExport';
import type { ExperimentTemplateData, ParameterValues } from '@/types/experiment';
import type { AppUser } from '@/types/models';
import type { SimulationDataPoint } from '@/types/simulation';

export {
    exportStoredSamplesCsv,
    exportWorkspaceCsv,
    parseStoredSimulationSamples,
    serializeSimulationSamples,
} from '@/lib/simulationExport';
export type { StoredSample } from '@/lib/simulationExport';

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Hook לניהול שמירה וייצוא של תוצאות ניסוי
 */
export function useExperimentPersistence(
    experiment: Pick<ExperimentTemplateData, 'slug'> | null | undefined,
    _user: AppUser | null | undefined,
    parameters: ParameterValues | null | undefined,
    simulationData: SimulationDataPoint[] | null | undefined
) {
    const { isAuthenticated, navigateToLogin } = useAuth();
    const { createRun } = useExperimentRunMutations();
    const { t } = useTranslation();

    // שמירת ריצה - זמינה רק למשתמשים מחוברים (אורחים לא שומרים מידע)
    const saveRun = useCallback(async () => {
        if (!isAuthenticated) {
            toast.info(t('workspace.saveRegisteredOnlyToast'), {
                action: {
                    label: t('common.signIn'),
                    onClick: () => navigateToLogin(),
                },
            });
            return;
        }
        if (!experiment || !simulationData || simulationData.length === 0) {
            toast.warning(t('workspace.noDataToSaveToast'));
            return;
        }

        try {
            const storedSamples = serializeSimulationSamples(simulationData);
            const runData = {
                experiment_slug: experiment.slug,
                parameters_json: parameters || {},
                samples_count: storedSamples.length,
                results_url: JSON.stringify(storedSamples),
                notes: ''
            };

            await createRun(runData);
            toast.success(t('workspace.runSavedToast'));
        } catch (error) {
            console.error('Error saving run:', error);
            toast.error(t('workspace.saveErrorPrefix') + errorMessage(error));
        }
    }, [experiment, parameters, simulationData, isAuthenticated, navigateToLogin, createRun, t]);

    // ייצוא נתונים ל-CSV
    const exportData = useCallback(() => {
        if (!simulationData || simulationData.length === 0) {
            toast.warning(t('workspace.noDataToExportToast'));
            return;
        }

        try {
            downloadCsv(
                exportWorkspaceCsv(simulationData),
                `${experiment?.slug || 'simulation'}_data_${Date.now()}.csv`
            );
            toast.success(t('workspace.dataExportedToast'));
        } catch (error) {
            console.error('Error exporting data:', error);
            toast.error(t('workspace.exportErrorPrefix') + errorMessage(error));
        }
    }, [simulationData, experiment, t]);

    return {
        saveRun,
        exportData
    };
}
