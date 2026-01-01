import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
//import { ExperimentTemplate, AppSettings, User as UserEntity } from "@/entities/all";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

/**
 * @param {string} experimentSlug - ה-slug של הניסוי (למשל: 'sho', 'free-fall', 'quantum-tunneling')
 * @returns {Object} אובייקט המכיל את כל הנתונים והמצבים
 */
export function useExperimentPageData(experimentSlug, settings, user, isRTL, allExperimentsList) {
    const navigate = useNavigate();
    const [experiment, setExperiment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!experimentSlug) {
            console.error('useExperimentPageData: experimentSlug is required');
            setIsLoading(false);
            return;
        }

        // Wait for allExperimentsList to be available
        if (!allExperimentsList || allExperimentsList.length === 0) {
            return; // Will retry when allExperimentsList becomes available
        }

        setIsLoading(true);
        try {
            const foundExperiment = allExperimentsList.find(
                 exp => exp.slug?.toLowerCase().trim() === experimentSlug.toLowerCase().trim()
            );

            if (!foundExperiment) {
                console.error(`Experiment with slug "${experimentSlug}" not found`);
                toast.error(isRTL ? `ניסוי "${experimentSlug}" לא נמצא` : `Experiment "${experimentSlug}" not found`);
                setIsLoading(false);
                navigate(createPageUrl("Dashboard"));
                return;
            }

            setExperiment(foundExperiment);

        } catch (error) {
            console.error('Error loading experiment page data:', error);
            toast.error(isRTL ? 'שגיאה בטעינת הניסוי' : 'Error loading experiment');
            setIsLoading(false);
            navigate(createPageUrl("Dashboard"));
        } finally {
            setIsLoading(false);
        }
    }, [experimentSlug, navigate, allExperimentsList, isRTL]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        experiment,
        isLoading
    };
}