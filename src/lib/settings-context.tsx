"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type SettingsContextType = {
    settings: Record<string, string>;
    getSetting: (key: string, defaultValue?: string) => string;
    isLoading: boolean;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        fetch('/api/fujiadmin/settings')
            .then(res => res.json())
            .then(data => {
                const settingsMap = data.reduce((acc: any, curr: any) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {});
                setSettings(settingsMap);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load settings", err);
                setIsLoading(false);
            });
    }, []);

    const getSetting = (key: string, defaultValue: string = "") => {
        return settings[key] || defaultValue;
    };

    return (
        <SettingsContext.Provider value={{ settings, getSetting, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
