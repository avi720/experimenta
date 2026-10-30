import { useCallback } from 'react';
import { toast } from 'sonner';
import { useExperimentRunMutations } from '@/hooks/useDataQueries';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/i18n';
import { downloadCsv } from '@/lib/csv';
import { exportWorkspaceCsv, serializeSimulationSamples } from '@/lib/simulationExport';
import { omitKeys, type RunChallenge } from '@/simulation/challenge';
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
    simulationData: SimulationDataPoint[] | null | undefined,
    challenge: RunChallenge | null = null,
    hiddenKeys: ReadonlyArray<string> = []
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
                notes: '',
                // Sent only for challenge runs, so ordinary saves never depend on the column.
                ...(challenge ? { challenge } : {}),
            };

            await createRun(runData);
            toast.success(t('workspace.runSavedToast'));
        } catch (error) {
            console.error('Error saving run:', error);
            toast.error(t('workspace.saveErrorPrefix') + errorMessage(error));
        }
    }, [experiment, parameters, simulationData, challenge, isAuthenticated, navigateToLogin, createRun, t]);

    // ייצוא נתונים ל-CSV
    const exportData = useCallback(() => {
        if (!simulationData || simulationData.length === 0) {
            toast.warning(t('workspace.noDataToExportToast'));
            return;
        }

        try {
            // Quantities that give away a hidden unknown stay out of the file until it is revealed.
            downloadCsv(
                exportWorkspaceCsv(omitKeys(simulationData, hiddenKeys)),
                `${experiment?.slug || 'simulation'}_data_${Date.now()}.csv`
            );
            toast.success(t('workspace.dataExportedToast'));
        } catch (error) {
            console.error('Error exporting data:', error);
            toast.error(t('workspace.exportErrorPrefix') + errorMessage(error));
        }
    }, [simulationData, experiment, hiddenKeys, t]);

    return {
        saveRun,
        exportData
    };
}
