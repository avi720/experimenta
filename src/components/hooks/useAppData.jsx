import { useState, useEffect, useCallback, useMemo } from "react";
import { AppSettings, ExperimentTemplate } from "@/entities/all";
import { useAuth } from "@/lib/AuthContext";

const DEFAULT_SETTINGS = { virtual_lab_enabled: true, locale_default: 'he' };

export function useAppData() {
    const { user, isLoadingAuth, logout, updateProfile, guestLocale, setGuestLocale } = useAuth();
    const [settings, setSettings] = useState(null);
    const [experiments, setExperiments] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const [settingsList, experimentsList] = await Promise.all([
                AppSettings.list().catch(() => []),
                ExperimentTemplate.list().catch(() => [])
            ]);
            setSettings(settingsList[0] || DEFAULT_SETTINGS);
            setExperiments(experimentsList.filter(exp => exp.is_active !== false));
        } catch (error) {
            console.error("Failed to load initial app data:", error);
            setSettings(DEFAULT_SETTINGS);
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

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

    const locale = user?.locale_preference || guestLocale || settings?.locale_default || 'he';
    const isRTL = useMemo(() => locale === 'he', [locale]);

    return {
        settings,
        user,
        experiments,
        isLoading: isLoadingData || isLoadingAuth,
        isRTL,
        locale,
        handleLogout,
        handleLanguageChange,
        reload: loadData
    };
}
