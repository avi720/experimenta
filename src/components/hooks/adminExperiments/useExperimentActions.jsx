import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExperimentTemplate } from '@/entities/all';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export function useExperimentActions(loadExperiments) {
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

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
                ...experiment,
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
        navigate(createPageUrl('AdminExperimentForm') + `?id=${experiment.slug}`, { state: { experiment } });
    }, [navigate]);

    return {
        isDeleting,
        isToggling,
        handleDelete,
        toggleActive,
        handleDuplicate,
        handleEdit
    };
}