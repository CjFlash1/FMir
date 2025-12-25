"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type TranslationContextType = {
    t: (key: string, defaultValue?: string) => string;
    lang: string;
    setLang: (lang: string) => void;
    isLoading: boolean;
};

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState("uk");
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Initialize from localStorage
    useEffect(() => {
        const savedLang = localStorage.getItem("fujimir_lang");
        if (savedLang && ["uk", "en", "ru"].includes(savedLang)) {
            setLangState(savedLang);
        }
    }, []);

    const setLang = (newLang: string) => {
        setLangState(newLang);
        localStorage.setItem("fujimir_lang", newLang);
    };

    useEffect(() => {
        setIsLoading(true);
        fetch(`/api/translations?lang=${lang}`)
            .then(res => res.json())
            .then(data => {
                setTranslations(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load translations", err);
                setIsLoading(false);
            });
    }, [lang]);

    const t = (key: string, defaultValue?: string) => {
        return translations[key] || defaultValue || key;
    };

    return (
        <TranslationContext.Provider value={{ t, lang, setLang, isLoading }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error("useTranslation must be used within a TranslationProvider");
    }
    return context;
}
