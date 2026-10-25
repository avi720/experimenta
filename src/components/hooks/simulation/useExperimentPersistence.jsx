import { useCallback } from 'react';
import { toast } from 'sonner';
import { ExperimentRun } from '@/entities/ExperimentRun';
import { useAuth } from '@/lib/AuthContext';

const MAX_STORED_SAMPLES = 500;

function serializeCsvCell(val) {
    if (typeof val === 'number') {
        return Number.isFinite(val) ? val.toFixed(6) : '';
    }
    if (val && typeof val === 'object') {
        if (typeof val.y === 'number') {
            return val.y.toFixed(6);
        }
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
    }
    return val ?? '';
}

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
    const { isAuthenticated, navigateToLogin, user, guestLocale } = useAuth();
    const activeLocale =
        user?.locale_preference ||
        guestLocale ||
        (typeof document !== 'undefined' && document.documentElement?.lang) ||
        'he';
    const isRTL = activeLocale === 'he';

    // שמירת ריצה - זמינה רק למשתמשים מחוברים (אורחים לא שומרים מידע)
    const saveRun = useCallback(async () => {
        if (!isAuthenticated) {
            toast.info(
                isRTL
                    ? 'שמירת ריצות זמינה למשתמשים רשומים בלבד.'
                    : 'Saving runs is available to registered users only.',
                {
                    action: {
                        label: isRTL ? 'התחברות' : 'Sign in',
                        onClick: () => navigateToLogin(),
                    },
                }
            );
            return;
        }
        if (!experiment || !simulationData || simulationData.length === 0) {
            toast.warning(isRTL ? 'אין נתונים לשמירה' : 'No data to save');
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

            await ExperimentRun.create(runData);
            toast.success(isRTL ? 'הריצה נשמרה בהצלחה!' : 'Run saved successfully!');
        } catch (error) {
            console.error('Error saving run:', error);
            toast.error((isRTL ? 'שגיאה בשמירת הריצה: ' : 'Error saving run: ') + error.message);
        }
    }, [experiment, parameters, simulationData, isAuthenticated, navigateToLogin, isRTL]);

    // ייצוא נתונים ל-CSV
    const exportData = useCallback(() => {
        if (!simulationData || simulationData.length === 0) {
            toast.warning(isRTL ? 'אין נתונים לייצוא' : 'No data to export');
            return;
        }

        try {
            const keys = Object.keys(simulationData[0]).filter(
                (key) => key !== 'shouldStop' && key !== 'debug' && key !== 'pattern' && key !== 'parameters'
            );
            const headers = keys.join(',');
            const rows = simulationData.map(point =>
                keys.map(key => serializeCsvCell(point[key])).join(',')
            );
            const csv = [headers, ...rows].join('\n');

            // הורדת הקובץ
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${experiment?.slug || 'simulation'}_data_${Date.now()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success(isRTL ? 'הנתונים יוצאו בהצלחה' : 'Data exported successfully');
        } catch (error) {
            console.error('Error exporting data:', error);
            toast.error((isRTL ? 'שגיאה בייצוא הנתונים: ' : 'Error exporting data: ') + error.message);
        }
    }, [simulationData, experiment, isRTL]);

    return {
        saveRun,
        exportData
    };
}
