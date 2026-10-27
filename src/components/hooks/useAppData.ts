import { useCallback, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation, type Locale } from "@/i18n";
import { DEFAULT_SETTINGS, useAppSettingsQuery, useExperimentTemplatesQuery } from "@/hooks/useDataQueries";

export function useAppData() {
    const { user, isLoadingAuth, logout, updateProfile, setGuestLocale } = useAuth();

    const settingsQuery = useAppSettingsQuery();
    const experimentsQuery = useExperimentTemplatesQuery();

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

    const handleLanguageChange = useCallback(async (newLocale: Locale) => {
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
