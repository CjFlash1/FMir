"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, X } from "lucide-react";

interface HelpCategoryFormProps {
    initialData?: any;
    onSave: () => void;
    onCancel: () => void;
}

export function HelpCategoryForm({ initialData, onSave, onCancel }: HelpCategoryFormProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [slug, setSlug] = useState(initialData?.slug || "");
    const [translations, setTranslations] = useState({
        uk: initialData?.translations?.find((tr: any) => tr.lang === "uk")?.name || "",
        ru: initialData?.translations?.find((tr: any) => tr.lang === "ru")?.name || "",
        en: initialData?.translations?.find((tr: any) => tr.lang === "en")?.name || ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = initialData
                ? `/api/admin/help/categories/${initialData.id}`
                : "/api/admin/help/categories";

            const res = await fetch(url, {
                method: initialData ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: initialData?.id,
                    slug,
                    translations: [
                        { lang: "uk", name: translations.uk },
                        { lang: "ru", name: translations.ru },
                        { lang: "en", name: translations.en }
                    ]
                })
            });

            if (!res.ok) throw new Error("Failed to save category");
            onSave();
        } catch (error) {
            console.error(error);
            alert("Error saving category");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{initialData ? "Edit Category" : "New Category"}</h3>
                <Button type="button" variant="ghost" onClick={onCancel} size="icon"><X size={20} /></Button>
            </div>

            <div className="grid gap-2">
                <Label>Slug (ID)</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g., technical" required />
            </div>

            <Tabs defaultValue="uk" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="uk">🇺🇦 Українська</TabsTrigger>
                    <TabsTrigger value="ru">🇷🇺 Русский</TabsTrigger>
                    <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
                </TabsList>
                {(["uk", "ru", "en"] as const).map((lang) => (
                    <TabsContent key={lang} value={lang} className="space-y-4 mt-4">
                        <div className="grid gap-2">
                            <Label>Category Name ({lang.toUpperCase()})</Label>
                            <Input
                                value={translations[lang]}
                                onChange={(e) => setTranslations(prev => ({ ...prev, [lang]: e.target.value }))}
                                placeholder="Category Title"
                                required={lang === "uk"} // Require at least UA
                            />
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading} className="bg-[#009846] hover:bg-[#009846]/90">
                    <Save size={18} className="mr-2" />
                    Save Category
                </Button>
            </div>
        </form>
    );
}
