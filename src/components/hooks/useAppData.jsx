import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppSettings, ExperimentTemplate } from "@/entities/all";
import { useAuth } from "@/lib/AuthContext";
import { appQueryKeys } from "@/lib/query-client";
import { useTranslation } from "@/i18n";

const DEFAULT_SETTINGS = { virtual_lab_enabled: true, locale_default: 'he' };

export function useAppData() {
    const { user, isLoadingAuth, logout, updateProfile, setGuestLocale } = useAuth();

    const settingsQuery = useQuery({
        queryKey: appQueryKeys.settings,
        queryFn: async () => (await AppSettings.list())[0] || DEFAULT_SETTINGS,
        staleTime: 5 * 60 * 1000,
    });

    const experimentsQuery = useQuery({
        queryKey: appQueryKeys.experiments,
        queryFn: () => ExperimentTemplate.list(),
        staleTime: 60 * 1000,
    });

    const settings = settingsQuery.isError ? DEFAULT_SETTINGS : settingsQuery.data ?? null;
    const experiments = useMemo(
        () => (experimentsQuery.data ?? []).filter(exp => exp.is_active !== false),
        [experimentsQuery.data]
    );

    const handleLogout = useCallback(async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        }
    }, [logout]);

    const handleLanguageChange = useCallback(async (newLocale) => {
        if (!user) {
            setGuestLocale(newLocale);
            return;
        }
        try {
            await updateProfile({ locale_preference: newLocale });
        } catch (error) {
            console.error("Language change error:", error);
        }
    }, [user, updateProfile, setGuestLocale]);

    // Locale and <html lang/dir> are owned by I18nProvider.
    const { locale, isRTL } = useTranslation();

    return {
        settings,
        user,
        experiments,
        isLoading: settingsQuery.isPending || experimentsQuery.isPending || isLoadingAuth,
        isRTL,
        locale,
        handleLogout,
        handleLanguageChange,
        reload: experimentsQuery.refetch
    };
}
