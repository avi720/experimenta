import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { canAccessExperiment } from "@/lib/access";
import { translate } from "@/i18n";

/**
 * @param {string} experimentSlug - ה-slug של הניסוי (למשל: 'sho', 'free-fall', 'quantum-tunneling')
 * @returns {Object} אובייקט המכיל את כל הנתונים והמצבים
 */
export function useExperimentPageData(experimentSlug, settings, user, isRTL, allExperimentsList) {
    const navigate = useNavigate();
    const [experiment, setExperiment] = useState(null);
    const [blockedExperiment, setBlockedExperiment] = useState(null);
    const [accessDeniedReason, setAccessDeniedReason] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const lastToastKeyRef = useRef(null);

    const loadData = useCallback(async () => {
        if (!experimentSlug) {
            console.error('useExperimentPageData: experimentSlug is required');
            setIsLoading(false);
            return;
        }

        // Wait until the experiments list has been loaded (undefined = still loading)
        if (!allExperimentsList) {
            return;
        }

        setIsLoading(true);
        try {
            const foundExperiment = allExperimentsList.find(
                exp => exp.slug?.toLowerCase().trim() === experimentSlug.toLowerCase().trim()
            );

            if (!foundExperiment) {
                console.error(`Experiment with slug "${experimentSlug}" not found`);
                toast.error(translate(isRTL, 'workspace.experimentNotFoundToast', { slug: experimentSlug }));
                setExperiment(null);
                setBlockedExperiment(null);
                setAccessDeniedReason(null);
                setIsLoading(false);
                navigate(createPageUrl("Dashboard"));
                return;
            }

            if (!canAccessExperiment(user, foundExperiment)) {
                setExperiment(null);
                setBlockedExperiment(foundExperiment);

                // Signed-in user lacking premium access: stay on a stable page and show a localized premium message (T39)
                if (user) {
                    setAccessDeniedReason('premium');
                    const toastKey = `premium:${foundExperiment.slug}:${user.id || 'user'}`;
                    if (lastToastKeyRef.current !== toastKey) {
                        lastToastKeyRef.current = toastKey;
                        toast.error(translate(isRTL, 'workspace.premiumOnlyToast'));
                    }
                    setIsLoading(false);
                    return;
                }

                // Guest user: redirect to Login with return path
                setAccessDeniedReason('registered');
                const isPremium = foundExperiment.access_level === 'premium';
                toast.error(
                    translate(
                        isRTL,
                        isPremium ? 'workspace.premiumOnlyToast' : 'workspace.registeredOnlyToast'
                    )
                );
                setIsLoading(false);
                const returnUrl = `${window.location.pathname}${window.location.search || ''}`;
                navigate(`${createPageUrl("Login")}?redirect=${encodeURIComponent(returnUrl)}`);
                return;
            }

            setBlockedExperiment(null);
            setAccessDeniedReason(null);
            setExperiment(foundExperiment);
        } catch (error) {
            console.error('Error loading experiment page data:', error);
            toast.error(translate(isRTL, 'workspace.loadErrorToast'));
            setIsLoading(false);
            navigate(createPageUrl("Dashboard"));
        } finally {
            setIsLoading(false);
        }
    }, [experimentSlug, navigate, allExperimentsList, isRTL, user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        experiment,
        blockedExperiment,
        accessDeniedReason,
        isLoading
    };
}
