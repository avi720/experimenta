import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExperimentTemplateMutations } from '@/hooks/useDataQueries';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';
import type { ExperimentTemplateData } from '@/types/experiment';

export function useExperimentActions(filteredExperiments: ExperimentTemplateData[] = []) {
    const navigate = useNavigate();
    const { createTemplate, updateTemplate, deleteTemplate } = useExperimentTemplateMutations();
    const { t } = useTranslation();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    const exportExperiments = useCallback(() => {
        if (!Array.isArray(filteredExperiments) || filteredExperiments.length === 0) {
            toast.error(t('admin.list.toasts.noExperimentsToExport'));
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
            toast.success(t('admin.list.toasts.exportSuccess', { count: cleanTemplates.length }));
        } catch (error) {
            console.error('Error exporting experiments:', error);
            toast.error(t('admin.list.toasts.exportError'));
        }
    }, [filteredExperiments, t]);

    const handleDelete = useCallback(async (experimentId: string) => {
        setIsDeleting(true);
        try {
            await deleteTemplate(experimentId);
            toast.success(t('admin.list.toasts.deleteSuccess'));
        } catch (error) {
            console.error('Error deleting experiment:', error);
            toast.error(t('admin.list.toasts.deleteError'));
        } finally {
            setIsDeleting(false);
        }
    }, [deleteTemplate, t]);

    const toggleActive = useCallback(async (experiment: ExperimentTemplateData) => {
        setIsToggling(true);
        try {
            await updateTemplate(experiment.id, {
                is_active: !experiment.is_active
            });
            toast.success(experiment.is_active ? t('admin.list.toasts.deactivatedSuccess') : t('admin.list.toasts.activatedSuccess'));
        } catch (error) {
            console.error('Error toggling experiment:', error);
            toast.error(t('admin.list.toasts.toggleError'));
        } finally {
            setIsToggling(false);
        }
    }, [updateTemplate, t]);

    const handleDuplicate = useCallback(async (experiment: ExperimentTemplateData) => {
        try {
            const { id: _id, created_date: _createdDate, updated_date: _updatedDate, created_by: _createdBy, ...expData } = experiment;
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
            await createTemplate(newExp);
            toast.success(t('admin.list.toasts.duplicateSuccess'));
        } catch (error) {
            console.error('Error duplicating experiment:', error);
            toast.error(t('admin.list.toasts.duplicateError'));
        }
    }, [createTemplate, t]);

    const handleEdit = useCallback((experiment: ExperimentTemplateData) => {
        navigate(createPageUrl('AdminExperimentForm') + `?id=${experiment.id}`, { state: { experiment } });
    }, [navigate]);

    return {
        isDeleting,
        isToggling,
        exportExperiments,
        handleDelete,
        toggleActive,
        handleDuplicate,
        handleEdit
    };
}
