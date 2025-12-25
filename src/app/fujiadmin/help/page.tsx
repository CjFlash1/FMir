"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { FilePlus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpArticleForm } from "@/components/admin/help-article-form";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

export default function AdminHelpPage() {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);

    // We fetch categories to pass to the form, but we list Articles primarily.

    const [isArtOpen, setIsArtOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<any>(null);

    const fetchData = async () => {
        try {
            // Fetch categories for the form dropdown
            const resCats = await fetch("/api/admin/help/categories");
            if (resCats.ok) {
                setCategories(await resCats.json());
            }

            // Fetch ALL articles
            const resArts = await fetch("/api/admin/help/articles"); // We need to ensure this endpoint returns ALL articles if no category is specified.
            if (resArts.ok) {
                setArticles(await resArts.json());
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEditArticle = (article: any) => {
        setEditingArticle(article);
        setIsArtOpen(true);
    }

    const handleDeleteArticle = async (id: string) => {
        if (!confirm("Are you sure you want to delete this page?")) return;

        try {
            const res = await fetch(`/api/admin/help/articles/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to delete article");
            }
        } catch (error) {
            console.error("Error deleting article:", error);
            alert("Error deleting article");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {t("admin.help", "Help Pages Management")}
                </h1>
                <Dialog open={isArtOpen} onOpenChange={setIsArtOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingArticle(null)} className="bg-[#009846] hover:bg-[#009846]/90">
                            <FilePlus size={18} className="mr-2" /> New Page
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[1000px] h-[90vh] p-0">
                        <DialogTitle className="sr-only">Help Article Editor</DialogTitle>
                        {/* Passed P-0 to remove padding, we handle it in form */}
                        <HelpArticleForm
                            initialData={editingArticle}
                            categories={categories}
                            onSave={() => { setIsArtOpen(false); fetchData(); }}
                            onCancel={() => setIsArtOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-semibold text-slate-700">Sort</th>
                            <th className="p-4 font-semibold text-slate-700">Title (RU)</th>
                            <th className="p-4 font-semibold text-slate-700">Slug (URL)</th>
                            <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {articles.map((article) => {
                            const title = article.translations.find((t: any) => t.lang === 'ru')?.title || "Untitled";
                            return (
                                <tr key={article.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-500 w-16">{article.sortOrder}</td>
                                    <td className="p-4 font-medium text-slate-900">{title}</td>
                                    <td className="p-4 text-slate-500 font-mono text-xs">{article.slug}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditArticle(article)}>
                                                <Edit size={16} className="text-blue-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteArticle(article.id)}>
                                                <Trash2 size={16} className="text-red-600" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {articles.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400">
                                    No help pages found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
