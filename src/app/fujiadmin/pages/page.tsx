"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Edit2, Save, X, Eye } from "lucide-react";

export default function CMSPages() {
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPage, setEditingPage] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const res = await fetch("/api/fujiadmin/cms/pages");
            const data = await res.json();
            setPages(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const method = editingPage.id ? "PUT" : "POST";
            const res = await fetch("/api/fujiadmin/cms/pages", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingPage),
            });
            if (res.ok) {
                setEditingPage(null);
                fetchPages();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to save page");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`/api/fujiadmin/cms/pages?id=${id}`, { method: "DELETE" });
            fetchPages();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (editingPage) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">
                        {editingPage.id ? "Edit Page" : "Create New Page"}
                    </h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setEditingPage(null)}>
                            <X className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Page
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Content</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold uppercase text-slate-500">Title</label>
                                    <Input
                                        placeholder="e.g. Terms of Service"
                                        value={editingPage.title || ""}
                                        onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold uppercase text-slate-500">HTML Content</label>
                                    <textarea
                                        className="w-full min-h-[400px] p-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="<h1>Heading</h1><p>Content goes here...</p>"
                                        value={editingPage.content || ""}
                                        onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold uppercase text-slate-500">URL Slug</label>
                                    <Input
                                        placeholder="e.g. terms-of-service"
                                        value={editingPage.slug || ""}
                                        onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold uppercase text-slate-500">Meta Description</label>
                                    <textarea
                                        className="w-full min-h-[100px] p-2 bg-white border border-slate-200 rounded-md text-sm"
                                        placeholder="Short summary for SEO..."
                                        value={editingPage.description || ""}
                                        onChange={(e) => setEditingPage({ ...editingPage, description: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editingPage.isActive}
                                        onChange={(e) => setEditingPage({ ...editingPage, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-primary-600"
                                    />
                                    <span className="text-sm font-medium">Published</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Informational Pages</h1>
                <Button onClick={() => setEditingPage({ title: "", slug: "", content: "", description: "", isActive: true })}>
                    <Plus className="w-4 h-4 mr-2" /> New Page
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {pages.map((page) => (
                            <div key={page.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${page.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{page.title}</h3>
                                        <p className="text-sm text-slate-500">/{page.slug}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" title="View Public Page">
                                        <Eye className="w-4 h-4 text-slate-400" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setEditingPage(page)}>
                                        <Edit2 className="w-4 h-4 text-slate-400" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="hover:text-red-500" onClick={() => handleDelete(page.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {pages.length === 0 && (
                            <div className="p-8 text-center text-slate-500">
                                No pages created yet. Click "New Page" to begin.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
