import { useCallback } from 'react';
import { ExperimentRun } from '@/entities/ExperimentRun';

/**
 * Hook לניהול שמירה וייצוא של תוצאות ניסוי
 */
export function useExperimentPersistence(experiment, user, parameters, simulationData) {
    // שמירת ריצה
    const saveRun = useCallback(async () => {
        if (!experiment || !simulationData || simulationData.length === 0) {
            alert('אין נתונים לשמירה');
            return;
        }

        try {
            const runData = {
                experiment_slug: experiment.slug,
                parameters_json: JSON.stringify(parameters || {}),
                samples_count: simulationData.length,
                notes: ''
            };

            await ExperimentRun.create(runData);
            alert('הריצה נשמרה בהצלחה!');
        } catch (error) {
            console.error('Error saving run:', error);
            alert('שגיאה בשמירת הריצה: ' + error.message);
        }
    }, [experiment, parameters, simulationData]);

    // ייצוא נתונים ל-CSV
    const exportData = useCallback(() => {
        if (!simulationData || simulationData.length === 0) {
            alert('אין נתונים לייצוא');
            return;
        }

        try {
            // יצירת CSV
            const headers = Object.keys(simulationData[0]).join(',');
            const rows = simulationData.map(point => 
                Object.values(point).map(val => 
                    typeof val === 'number' ? val.toFixed(6) : val
                ).join(',')
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
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('שגיאה בייצוא הנתונים: ' + error.message);
        }
    }, [simulationData, experiment]);

    return {
        saveRun,
        exportData
    };
}