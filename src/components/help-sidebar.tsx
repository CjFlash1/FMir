"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface HelpSidebarProps {
    articles: any[];
}

export function HelpSidebar({ articles }: HelpSidebarProps) {
    const { t, lang } = useTranslation();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false); // Added useState

    useEffect(() => { // Added useEffect
        setMounted(true);
    }, []);

    // Helper to get translation or fallback
    const getTr = (l: string, article: any) => article.translations.find((tr: any) => tr.lang === l); // Modified getTr to accept article

    return (
        <nav className="space-y-1">
            {articles.map((article) => {
                // Replaced original translation logic with new helper
                const translation = getTr(lang, article) || getTr('ru', article) || article.translations[0];

                const title = translation?.title || "Untitled";
                const href = `/p/help/${article.slug}`;
                const isActive = pathname === href;

                return (
                    <Link
                        key={article.id}
                        href={href}
                        className={cn(
                            "block px-4 py-3 text-sm font-medium rounded-md transition-colors",
                            isActive
                                ? "bg-[#009846] text-white shadow-sm"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                    >
                        {title}
                    </Link>
                );
            })}
        </nav>
    );
}
