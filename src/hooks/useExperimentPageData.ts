import { useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { canAccessExperiment } from "@/lib/access";
import { translate } from "@/i18n";
import { asTemplateData } from "./experimentTemplateData";
import type { ExperimentTemplateData } from "@/types/experiment";
import type { AppSettings, AppUser, ExperimentTemplate } from "@/types/models";

export type AccessDeniedReason = 'premium' | 'registered';

export type UseExperimentPageDataResult = {
    experiment: ExperimentTemplateData | null;
    blockedExperiment: ExperimentTemplateData | null;
    accessDeniedReason: AccessDeniedReason | null;
    isLoading: boolean;
};

/**
 * @param experimentSlug - ה-slug של הניסוי (למשל: 'sho', 'free-fall', 'quantum-tunneling')
 * @param allExperimentsList - undefined while the list is still loading
 * @returns אובייקט המכיל את כל הנתונים והמצבים
 */
export function useExperimentPageData(
    experimentSlug: string | null,
    _settings: AppSettings | null,
    user: AppUser | null,
    isRTL: boolean | undefined,
    allExperimentsList: ExperimentTemplate[] | undefined
): UseExperimentPageDataResult {
    const navigate = useNavigate();
    const lastToastKeyRef = useRef<string | null>(null);

    const { experiment, blockedExperiment, accessDeniedReason, notFound, isGuestRedirect } = useMemo(() => {
        if (!allExperimentsList || !experimentSlug) {
            return {
                experiment: null,
                blockedExperiment: null,
                accessDeniedReason: null,
                notFound: false,
                isGuestRedirect: false,
            };
        }

        const foundExperiment = allExperimentsList.find(
            exp => exp.slug?.toLowerCase().trim() === experimentSlug.toLowerCase().trim()
        );

        if (!foundExperiment) {
            return {
                experiment: null,
                blockedExperiment: null,
                accessDeniedReason: null,
                notFound: true,
                isGuestRedirect: false,
            };
        }

        if (!canAccessExperiment(user, foundExperiment)) {
            const blocked = asTemplateData(foundExperiment);
            if (user) {
                return {
                    experiment: null,
                    blockedExperiment: blocked,
                    accessDeniedReason: 'premium' as const,
                    notFound: false,
                    isGuestRedirect: false,
                };
            }
            return {
                experiment: null,
                blockedExperiment: blocked,
                accessDeniedReason: 'registered' as const,
                notFound: false,
                isGuestRedirect: true,
            };
        }

        return {
            experiment: asTemplateData(foundExperiment),
            blockedExperiment: null,
            accessDeniedReason: null,
            notFound: false,
            isGuestRedirect: false,
        };
    }, [allExperimentsList, experimentSlug, user]);

    const isLoading = Boolean(allExperimentsList === undefined && experimentSlug);

    useEffect(() => {
        if (!allExperimentsList || !experimentSlug) return;

        if (notFound) {
            console.error(`Experiment with slug "${experimentSlug}" not found`);
            toast.error(translate(isRTL, 'workspace.experimentNotFoundToast', { slug: experimentSlug }));
            navigate(createPageUrl("Dashboard"));
            return;
        }

        if (blockedExperiment && accessDeniedReason === 'premium') {
            const toastKey = `premium:${blockedExperiment.slug}:${user?.id || 'user'}`;
            if (lastToastKeyRef.current !== toastKey) {
                lastToastKeyRef.current = toastKey;
                toast.error(translate(isRTL, 'workspace.premiumOnlyToast'));
            }
            return;
        }

        if (blockedExperiment && isGuestRedirect) {
            const isPremium = blockedExperiment.access_level === 'premium';
            toast.error(
                translate(
                    isRTL,
                    isPremium ? 'workspace.premiumOnlyToast' : 'workspace.registeredOnlyToast'
                )
            );
            const returnUrl = `${window.location.pathname}${window.location.search || ''}`;
            navigate(`${createPageUrl("Login")}?redirect=${encodeURIComponent(returnUrl)}`);
        }
    }, [notFound, blockedExperiment, accessDeniedReason, isGuestRedirect, isRTL, experimentSlug, navigate, user?.id, allExperimentsList]);

    return {
        experiment,
        blockedExperiment,
        accessDeniedReason,
        isLoading
    };
}
