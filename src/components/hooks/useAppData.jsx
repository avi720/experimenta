import { useState, useEffect, useCallback, useMemo } from "react";
import { AppSettings, User as UserEntity, ExperimentTemplate } from "@/entities/all";
import { base44 } from "@/api/base44Client";

export function useAppData() {
    const [settings, setSettings] = useState(null);
    const [user, setUser] = useState(null);
    const [experiments, setExperiments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [settingsList, currentUser, experimentsList] = await Promise.all([
                AppSettings.list(),
                base44.auth.me().catch(() => null),
                ExperimentTemplate.list().catch(() => [])
            ]);
            updatedUser = currentUser;
            if (currentUser && !currentUser.locale_preference) {
                console.log("User has no locale preference, setting default to Hebrew.");
                await base44.auth.updateMe({ locale_preference: 'he' });
                updatedUser = { ...currentUser, locale_preference: 'he' }; 
            }    
            setSettings(settingsList[0] || { virtual_lab_enabled: true /*locale_default: 'he'*/ });
            setUser(updatedUser);
            setExperiments(experimentsList.filter(exp => exp.is_active !== false));
        } catch (error) {
            console.error("Failed to load initial app data:", error);
            setSettings({ virtual_lab_enabled: true});
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleLogout = async () => {
        try {
            await UserEntity.logout();
            window.location.reload();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleLanguageChange = async (newLocale) => {
        try {
            window.location.reload();
            if(user){
                await base44.auth.updateMe({ locale_preference: newLocale });
                setUser(prevUser => ({ ...prevUser, locale_preference: newLocale }));
            }
        } catch (error) {
            console.error("Language change error:", error);
        }
    };

    const isRTL = useMemo(()=>{
        const localePreference = user?.locale_preference;
        return localePreference === 'he'
    },[user]);

    return {
        settings,
        user,
        experiments,
        isLoading,
        isRTL,
        handleLogout,
        handleLanguageChange
    };
}