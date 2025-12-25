"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function PublicPage() {
    const { slug } = useParams() as { slug: string };
    const { lang, t } = useTranslation();
    const [page, setPage] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        setPage(null);
        fetch(`/api/pages/${slug}?lang=${lang}`)
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.details || 'Failed to fetch');
                return data;
            })
            .then(data => {
                setPage(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("PublicPage Catch:", err);
                setLoading(false);
            });
    }, [slug, lang]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f3f1e9] flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#009846]" />
            </div>
        );
    }

    if (!page) {
        return (
            <div className="min-h-screen bg-[#f3f1e9] py-20 text-center">
                <h1 className="text-3xl font-black text-[#4c4c4c]">{t('Page not found')}</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f3f1e9] py-12 md:py-20">
            <div className="max-w-4xl mx-auto px-4 bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-[#c5b98e]/20">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-black tracking-tight text-[#009846] sm:text-5xl uppercase italic">
                        {page.title}
                    </h1>
                    <div className="h-1 w-24 bg-[#e31e24] mx-auto mt-6 rounded-full" />
                </header>

                <div
                    className="prose prose-green prose-lg max-w-none 
                    prose-headings:font-black prose-headings:text-[#009846]
                    prose-p:text-[#4c4c4c] prose-p:leading-relaxed
                    prose-li:text-[#4c4c4c]
                    prose-strong:text-[#4c4c4c] prose-strong:font-black
                    prose-a:text-[#e31e24] prose-a:font-black underline-offset-4"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                />
            </div>
        </div>
    );
}
