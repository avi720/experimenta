import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExperimentTemplate } from '@/entities/all';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export function useExperimentActions(loadExperiments, filteredExperiments = []) {
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    const exportExperiments = useCallback(() => {
        if (!Array.isArray(filteredExperiments) || filteredExperiments.length === 0) {
            toast.error('אין ניסויים לייצוא');
            return;
        }
        try {
            const cleanTemplates = filteredExperiments.map(
                ({ id: _id, created_date: _createdDate, updated_date: _updatedDate, created_by: _createdBy, ...rest }) => rest
            );
            const dataStr = JSON.stringify(cleanTemplates, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dateStamp = new Date().toISOString().slice(0, 10);
            a.download = `experiments_export_${dateStamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(`יוצאו ${cleanTemplates.length} ניסויים בהצלחה`);
        } catch (error) {
            console.error('Error exporting experiments:', error);
            toast.error('אירעה שגיאה בייצוא הניסויים');
        }
    }, [filteredExperiments]);

    const handleDelete = useCallback(async (experimentId) => {
        setIsDeleting(true);
        try {
            await ExperimentTemplate.delete(experimentId);
            toast.success('הניסוי נמחק בהצלחה');
            await loadExperiments();
        } catch (error) {
            console.error('Error deleting experiment:', error);
            toast.error('אירעה שגיאה במחיקת הניסוי');
        } finally {
            setIsDeleting(false);
        }
    }, [loadExperiments]);

    const toggleActive = useCallback(async (experiment) => {
        setIsToggling(true);
        try {
            await ExperimentTemplate.update(experiment.id, {
                is_active: !experiment.is_active
            });
            toast.success(experiment.is_active ? 'הניסוי הושבת' : 'הניסוי הופעל');
            await loadExperiments();
        } catch (error) {
            console.error('Error toggling experiment:', error);
            toast.error('אירעה שגיאה בעדכון הניסוי');
        } finally {
            setIsToggling(false);
        }
    }, [loadExperiments]);

    const handleDuplicate = useCallback(async (experiment) => {
        try {
            const { id, created_date, updated_date, created_by, ...expData } = experiment;
            const newExp = {
                ...expData,
                slug: `${expData.slug}-copy-${Date.now()}`,
                i18n_texts: {
                    ...expData.i18n_texts,
                    he: {
                        ...expData.i18n_texts?.he,
                        title: `${expData.i18n_texts?.he?.title || ''} (עותק)`
                    },
                    en: {
                        ...expData.i18n_texts?.en,
                        title: `${expData.i18n_texts?.en?.title || ''} (Copy)`
                    }
                }
            };
            await ExperimentTemplate.create(newExp);
            toast.success('הניסוי שוכפל בהצלחה');
            await loadExperiments();
        } catch (error) {
            console.error('Error duplicating experiment:', error);
            toast.error('אירעה שגיאה בשכפול הניסוי');
        }
    }, [loadExperiments]);

    const handleEdit = useCallback((experiment) => {
        navigate(createPageUrl('AdminExperimentForm') + `?id=${experiment.id}`, { state: { experiment } });
    }, [navigate]);

    return {
        isDeleting,
        isToggling,
        handleDelete,
        toggleActive,
        handleDuplicate,
        handleEdit,
        exportExperiments
    };
}
