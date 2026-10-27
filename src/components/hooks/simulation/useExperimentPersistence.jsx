import { useCallback } from 'react';
import { toast } from 'sonner';
import { useExperimentRunMutations } from '@/hooks/useDataQueries';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/i18n';
import { downloadCsv, samplesToCsv } from '@/lib/csv';

const MAX_STORED_SAMPLES = 500;

function roundNumeric(val) {
    return typeof val === 'number' && Number.isFinite(val)
        ? Number(val.toFixed(6))
        : val;
}

/**
 * Normalizes and downsamples simulation points for persistent storage so
 * Results.jsx can render the exact saved dataset without re-running or
 * approximating the physics.
 */
export function serializeSimulationSamples(simulationData, maxSamples = MAX_STORED_SAMPLES) {
    if (!Array.isArray(simulationData) || simulationData.length === 0) {
        return [];
    }

    const total = simulationData.length;
    const selectedPoints = [];

    if (total <= maxSamples) {
        for (let i = 0; i < total; i++) {
            selectedPoints.push(simulationData[i]);
        }
    } else {
        for (let i = 0; i < maxSamples - 1; i++) {
            const idx = Math.floor((i * (total - 1)) / (maxSamples - 1));
            selectedPoints.push(simulationData[idx]);
        }
        selectedPoints.push(simulationData[total - 1]);
    }

    return selectedPoints.map((point) => {
        if (!point || typeof point !== 'object') return point;
        const clean = {};
        for (const [key, val] of Object.entries(point)) {
            if (key === 'shouldStop' || key === 'debug' || key === 'pattern' || key === 'parameters') {
                continue;
            }
            if (key === 'position' && val && typeof val === 'object' && typeof val.y === 'number') {
                clean.position = roundNumeric(val.y);
            } else if (typeof val === 'number') {
                clean[key] = roundNumeric(val);
            } else if (val !== undefined && typeof val !== 'object') {
                clean[key] = val;
            }
        }
        return clean;
    });
}

/**
 * Parses stored samples from `run.results_url` if present, returning null for legacy runs.
 */
export function parseStoredSimulationSamples(resultsUrl) {
    if (!resultsUrl || typeof resultsUrl !== 'string') return null;
    const trimmed = resultsUrl.trim();
    if (!trimmed.startsWith('[')) return null;
    try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch {
        return null;
    }
}

/**
 * Hook לניהול שמירה וייצוא של תוצאות ניסוי
 */
export function useExperimentPersistence(experiment, _user, parameters, simulationData) {
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
                parameters_json: JSON.stringify(parameters || {}),
                samples_count: storedSamples.length,
                results_url: JSON.stringify(storedSamples),
                notes: ''
            };

            await createRun(runData);
            toast.success(t('workspace.runSavedToast'));
        } catch (error) {
            console.error('Error saving run:', error);
            toast.error(t('workspace.saveErrorPrefix') + error.message);
        }
    }, [experiment, parameters, simulationData, isAuthenticated, navigateToLogin, createRun, t]);

    // ייצוא נתונים ל-CSV
    const exportData = useCallback(() => {
        if (!simulationData || simulationData.length === 0) {
            toast.warning(t('workspace.noDataToExportToast'));
            return;
        }

        try {
            const keys = Object.keys(simulationData[0]).filter(
                (key) => key !== 'shouldStop' && key !== 'debug' && key !== 'pattern' && key !== 'parameters'
            );
            downloadCsv(
                samplesToCsv(simulationData, keys),
                `${experiment?.slug || 'simulation'}_data_${Date.now()}.csv`
            );
            toast.success(t('workspace.dataExportedToast'));
        } catch (error) {
            console.error('Error exporting data:', error);
            toast.error(t('workspace.exportErrorPrefix') + error.message);
        }
    }, [simulationData, experiment, t]);

    return {
        saveRun,
        exportData
    };
}
