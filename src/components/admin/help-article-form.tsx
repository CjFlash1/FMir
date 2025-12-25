"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, X } from "lucide-react";

import { RichTextEditor } from "@/components/admin/rich-text-editor";

interface HelpArticleFormProps {
    initialData?: any;
    categories: any[];
    onSave: () => void;
    onCancel: () => void;
}

export function HelpArticleForm({ initialData, categories, onSave, onCancel }: HelpArticleFormProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [categoryId, setCategoryId] = useState(initialData?.helpCategoryId?.toString() || (categories[0]?.id?.toString() || ""));
    const [slug, setSlug] = useState(initialData?.slug || "");
    const [sortOrder, setSortOrder] = useState(initialData?.sortOrder?.toString() || "0");

    const [translations, setTranslations] = useState({
        uk: {
            title: initialData?.translations?.find((tr: any) => tr.lang === "uk")?.title || "",
            content: initialData?.translations?.find((tr: any) => tr.lang === "uk")?.content || ""
        },
        ru: {
            title: initialData?.translations?.find((tr: any) => tr.lang === "ru")?.title || "",
            content: initialData?.translations?.find((tr: any) => tr.lang === "ru")?.content || ""
        },
        en: {
            title: initialData?.translations?.find((tr: any) => tr.lang === "en")?.title || "",
            content: initialData?.translations?.find((tr: any) => tr.lang === "en")?.content || ""
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const url = initialData ? `/api/admin/help/articles/${initialData.id}` : "/api/admin/help/articles";
        const method = initialData ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: initialData?.id,
                    helpCategoryId: parseInt(categoryId),
                    slug,
                    sortOrder: parseInt(sortOrder),
                    translations: [
                        { lang: "uk", ...translations.uk },
                        { lang: "ru", ...translations.ru },
                        { lang: "en", ...translations.en }
                    ]
                })
            });

            if (!res.ok) throw new Error("Failed to save article");
            onSave();
        } catch (error) {
            console.error(error);
            alert("Error saving article");
        } finally {
            setIsLoading(false);
        }
    };

    const updateTranslation = (lang: "uk" | "ru" | "en", field: "title" | "content", value: string) => {
        setTranslations(prev => ({
            ...prev,
            [lang]: { ...prev[lang], [field]: value }
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{initialData ? "Edit Article" : "New Article"}</h3>
                <Button type="button" variant="ghost" onClick={onCancel} size="icon"><X size={20} /></Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                    {cat.translations[0]?.name || cat.slug}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Slug (URL Path)</Label>
                    <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. photo-sizes" required />
                </div>
                <div className="grid gap-2">
                    <Label>Sort Order</Label>
                    <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
                </div>
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
                            <Label>Title ({lang.toUpperCase()})</Label>
                            <Input
                                value={translations[lang].title}
                                onChange={(e) => updateTranslation(lang, "title", e.target.value)}
                                placeholder="Page Title"
                                required={lang === "uk"}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Content ({lang.toUpperCase()})</Label>
                            <RichTextEditor
                                value={translations[lang].content}
                                onChange={(value) => updateTranslation(lang, "content", value)}
                                placeholder="Enter content..."
                            />
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading} className="bg-[#009846] hover:bg-[#009846]/90">
                    <Save size={18} className="mr-2" />
                    Save Article
                </Button>
            </div>
        </form>
    );
}
