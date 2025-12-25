"use client";

import { useTranslation } from "@/lib/i18n";
import { useEffect, useState } from "react";

interface HelpArticleViewerProps {
    article: any;
}

export function HelpArticleViewer({ article }: HelpArticleViewerProps) {
    const { t, lang } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper to get translation or fallback
    const getTr = (l: string) => article.translations.find((t: any) => t.lang === l);
    const tr = getTr(lang) || getTr('ru') || article.translations[0];

    if (!mounted) {
        // Render a skeleton or just the server-side fallback (likely RU) to avoid mismatch
        // Actually, returning null causes layout shift. Returning RU is safer if we assume RU default.
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-200 rounded w-4/6"></div>
                </div>
            </div>
        );
    }

    if (!tr) return <div>Article content not found.</div>;

    return (
        <article className="prose prose-slate max-w-none">
            {/* The title is usually in the content, but we can verify. 
                Our seed puts h3 in content. 
                If we use the editor, we might just put the content directly.
            */}
            {/* <h1 className="text-2xl font-bold mb-4">{tr.title}</h1> */}
            <style jsx global>{`
                .help-content {
                    line-height: 1.6;
                    color: #334155; /* slate-700 */
                }
                .help-content p {
                    margin-bottom: 1rem;
                    white-space: normal;
                }
                .help-content h1, .help-content h2, .help-content h3 {
                    margin-top: 1.5rem;
                    margin-bottom: 1rem;
                    font-weight: 700;
                    line-height: 1.3;
                    color: #0f172a; /* slate-900 */
                }
                .help-content h3 { font-size: 1.25rem; }

                /* -- ROBUST TABLE THEME (Matches "Photo Sizes" Style) -- */
                .help-content table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem; 
                    border: 1px solid #d1d5db; /* gray-300 */
                }
                .help-content th,
                .help-content td {
                    border: 1px solid #d1d5db; /* gray-300 */
                    padding: 0.75rem; /* Spacious padding */
                    text-align: left;
                    vertical-align: middle;
                }
                .help-content th {
                    background-color: #f3f4f6; /* gray-100 */
                    font-weight: 700;
                    color: #111827; /* gray-900 */
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    letter-spacing: 0.05em;
                }
                /* Zebra Striping - Yellow Tint for ODD rows (simulates the design) */
                .help-content tbody tr:nth-of-type(odd) {
                    background-color: #fefce8; /* yellow-50 */
                }
                .help-content tbody tr:nth-of-type(even) {
                    background-color: #ffffff;
                }
                /* Interactive hover effect */
                .help-content tbody tr:hover {
                    background-color: #fef08a; /* yellow-200 highlight */
                }

                .help-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.5rem;
                    border: 1px solid #e2e8f0;
                }
                .help-content strong {
                    font-weight: 600;
                    color: #0f172a;
                }
            `}</style>
            <div className="help-content" dangerouslySetInnerHTML={{ __html: tr.content }} />
        </article>
    );
}
