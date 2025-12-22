"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";

interface PaperType {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
}

export default function PaperPage() {
    const [papers, setPapers] = useState<PaperType[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<PaperType>>({});

    useEffect(() => {
        fetch('/api/fujiadmin/config/paper')
            .then(res => res.json())
            .then(setPapers);
    }, []);

    const handleEdit = (paper: PaperType) => {
        setEditingId(paper.id);
        setEditForm(paper);
    };

    const handleSave = async () => {
        const isNew = editingId === -1;
        const method = isNew ? 'POST' : 'PUT';
        const res = await fetch('/api/fujiadmin/config/paper', {
            method,
            body: JSON.stringify(editForm),
        });
        if (res.ok) {
            const updated = await res.json();
            if (isNew) {
                setPapers([...papers, updated]);
            } else {
                setPapers(papers.map(p => p.id === updated.id ? updated : p));
            }
            setEditingId(null);
            setEditForm({});
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        const res = await fetch(`/api/fujiadmin/config/paper?id=${id}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            setPapers(papers.filter(p => p.id !== id));
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Paper Types</h3>
                <Button size="sm" className="gap-2" onClick={() => {
                    setEditingId(-1);
                    setEditForm({ name: '', slug: '', description: '', isActive: true });
                }}>
                    <Plus className="w-4 h-4" /> Add Paper
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs font-medium uppercase tracking-wider">
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Slug</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {editingId === -1 && (
                            <tr className="bg-primary-50">
                                <td className="px-6 py-4"><input className="w-full text-sm p-1 border rounded" placeholder="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></td>
                                <td className="px-6 py-4"><input className="w-full text-sm p-1 border rounded" placeholder="slug" value={editForm.slug} onChange={e => setEditForm({ ...editForm, slug: e.target.value })} /></td>
                                <td className="px-6 py-4"><input className="w-full text-sm p-1 border rounded" placeholder="Description" value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></td>
                                <td className="px-6 py-4">New</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={handleSave} className="p-1.5 text-primary-600 hover:bg-white rounded transition-colors"><Check className="w-4 h-4" /></button>
                                        <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-white rounded transition-colors"><X className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {papers.map((paper) => (
                            <tr key={paper.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    {editingId === paper.id ? (
                                        <input className="w-full p-1 border rounded" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                    ) : (
                                        <div className="font-medium text-slate-900">{paper.name}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{paper.slug}</td>
                                <td className="px-6 py-4 text-slate-500 text-sm">
                                    {editingId === paper.id ? (
                                        <input className="w-full p-1 border rounded" value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                                    ) : (
                                        paper.description
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {paper.isActive ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">ACTIVE</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">INACTIVE</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {editingId === paper.id ? (
                                            <>
                                                <button onClick={handleSave} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"><Check className="w-4 h-4" /></button>
                                                <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors"><X className="w-4 h-4" /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => handleEdit(paper)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(paper.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
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
