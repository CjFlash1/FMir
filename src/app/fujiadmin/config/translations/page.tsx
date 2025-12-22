"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Check, X, Search } from "lucide-react";

interface Translation {
    id: number;
    lang: string;
    key: string;
    value: string;
}

export default function TranslationsPage() {
    const [translations, setTranslations] = useState<Translation[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<Translation>>({});
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetch('/api/fujiadmin/config/translations')
            .then(res => res.json())
            .then(setTranslations);
    }, []);

    const handleSave = async () => {
        const res = await fetch('/api/fujiadmin/config/translations', {
            method: 'POST',
            body: JSON.stringify(editForm),
        });
        if (res.ok) {
            const updated = await res.json();
            setTranslations(prev => {
                const index = prev.findIndex(t => t.id === updated.id);
                if (index > -1) {
                    const next = [...prev];
                    next[index] = updated;
                    return next;
                }
                return [...prev, updated].sort((a, b) => a.key.localeCompare(b.key));
            });
            setEditingId(null);
            setEditForm({});
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        const res = await fetch(`/api/fujiadmin/config/translations?id=${id}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            setTranslations(translations.filter(t => t.id !== id));
        }
    };

    const filteredTranslations = translations.filter(t =>
        t.key.toLowerCase().includes(filter.toLowerCase()) ||
        t.value.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search translations..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
                <Button size="sm" className="gap-2" onClick={() => {
                    setEditingId(-1); // New entry
                    setEditForm({ lang: 'uk', key: '', value: '' });
                }}>
                    <Plus className="w-4 h-4" /> Add Key
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs font-medium uppercase tracking-wider">
                            <th className="px-6 py-3 w-1/4">Key</th>
                            <th className="px-6 py-3 w-16">Lang</th>
                            <th className="px-6 py-3">Value</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {editingId === -1 && (
                            <tr className="bg-primary-50">
                                <td className="px-6 py-4"><input className="w-full p-1 border rounded" placeholder="e.g. nav.home" value={editForm.key} onChange={e => setEditForm({ ...editForm, key: e.target.value })} /></td>
                                <td className="px-6 py-4">
                                    <select className="p-1 border rounded" value={editForm.lang} onChange={e => setEditForm({ ...editForm, lang: e.target.value })}>
                                        <option value="uk">UK</option>
                                        <option value="ru">RU</option>
                                        <option value="en">EN</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4"><input className="w-full p-1 border rounded" placeholder="Value..." value={editForm.value} onChange={e => setEditForm({ ...editForm, value: e.target.value })} /></td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={handleSave} className="p-1.5 text-primary-600 hover:bg-white rounded transition-colors"><Check className="w-4 h-4" /></button>
                                        <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-white rounded transition-colors"><X className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {filteredTranslations.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-slate-600">{t.key}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.lang === 'uk' ? 'bg-blue-100 text-blue-700' :
                                        t.lang === 'ru' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {t.lang.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-900 text-sm">
                                    {editingId === t.id ? (
                                        <input className="w-full p-1 border rounded" value={editForm.value} onChange={e => setEditForm({ ...editForm, value: e.target.value })} />
                                    ) : (
                                        t.value
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {editingId === t.id ? (
                                            <>
                                                <button onClick={handleSave} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"><Check className="w-4 h-4" /></button>
                                                <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors"><X className="w-4 h-4" /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => {
                                                    setEditingId(t.id);
                                                    setEditForm(t);
                                                }} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
