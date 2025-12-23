"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Search, Save, Globe } from "lucide-react";

export default function TranslationManager() {
    const [translations, setTranslations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchTranslations();
    }, []);

    const fetchTranslations = async () => {
        try {
            // Fetch for one lang to get keys, or just all
            const res = await fetch("/api/fujiadmin/config/translations");
            const data = await res.json();
            setTranslations(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (id: number, value: string) => {
        setSaving(id.toString());
        setSaveSuccess(null);
        try {
            const res = await fetch("/api/fujiadmin/config/translations", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, value }),
            });
            if (res.ok) {
                setSaveSuccess(`Saved ID ${id}`);
                setTimeout(() => setSaveSuccess(null), 3000);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(null);
        }
    };

    const filtered = translations.filter(t =>
        t.key.toLowerCase().includes(search.toLowerCase()) ||
        t.value.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Translation Manager</h1>
                    {saveSuccess && (
                        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-md text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            {saveSuccess}
                        </div>
                    )}
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        className="pl-9"
                        placeholder="Search keys or text..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 p-4 text-xs font-bold uppercase text-slate-500">
                        <div className="col-span-1">Lang</div>
                        <div className="col-span-4">Key</div>
                        <div className="col-span-7">Translation Value</div>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
                        {filtered.map((t) => (
                            <div key={t.id} className="grid grid-cols-12 items-center p-3 gap-4 hover:bg-slate-50/50">
                                <div className="col-span-1">
                                    <span className="px-2 py-1 bg-slate-200 rounded text-[10px] font-bold uppercase tracking-wider">{t.lang}</span>
                                </div>
                                <div className="col-span-4 text-sm font-mono text-slate-500 truncate" title={t.key}>
                                    {t.key}
                                </div>
                                <div className="col-span-7 flex gap-2">
                                    <Input
                                        value={t.value}
                                        onChange={(e) => {
                                            const newTrans = [...translations];
                                            const idx = newTrans.findIndex(item => item.id === t.id);
                                            newTrans[idx].value = e.target.value;
                                            setTranslations(newTrans);
                                        }}
                                        className="text-sm"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSave(t.id, t.value)}
                                        disabled={saving === t.id.toString()}
                                    >
                                        {saving === t.id.toString() ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
