"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";

interface PrintSize {
    id: number;
    name: string;
    slug: string;
    widthMm: number;
    heightMm: number;
    basePrice: number;
    isActive: boolean;
}

export default function SizesPage() {
    const [sizes, setSizes] = useState<PrintSize[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<PrintSize>>({});

    useEffect(() => {
        fetch('/api/fujiadmin/config/sizes')
            .then(res => res.json())
            .then(setSizes);
    }, []);

    const handleEdit = (size: PrintSize) => {
        setEditingId(size.id);
        setEditForm(size);
    };

    const handleSave = async () => {
        const isNew = editingId === -1;
        const method = isNew ? 'POST' : 'PUT';
        const res = await fetch('/api/fujiadmin/config/sizes', {
            method,
            body: JSON.stringify(editForm),
        });
        if (res.ok) {
            const updated = await res.json();
            if (isNew) {
                setSizes([...sizes, updated].sort((a, b) => a.basePrice - b.basePrice));
            } else {
                setSizes(sizes.map(s => s.id === updated.id ? updated : s));
            }
            setEditingId(null);
            setEditForm({});
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        const res = await fetch(`/api/fujiadmin/config/sizes?id=${id}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            setSizes(sizes.filter(s => s.id !== id));
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Available Sizes</h3>
                <Button size="sm" className="gap-2" onClick={() => {
                    setEditingId(-1);
                    setEditForm({ name: '', slug: '', widthMm: 0, heightMm: 0, basePrice: 0, isActive: true });
                }}>
                    <Plus className="w-4 h-4" /> Add Size
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs font-medium uppercase tracking-wider">
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Slug</th>
                            <th className="px-6 py-3">Dimensions (mm)</th>
                            <th className="px-6 py-3">Base Price</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {editingId === -1 && (
                            <tr className="bg-primary-50">
                                <td className="px-6 py-4"><input className="w-full text-sm p-1 border rounded" placeholder="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></td>
                                <td className="px-6 py-4"><input className="w-full text-sm p-1 border rounded" placeholder="slug" value={editForm.slug} onChange={e => setEditForm({ ...editForm, slug: e.target.value })} /></td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1">
                                        <input className="w-16 text-sm p-1 border rounded" placeholder="W" value={editForm.widthMm} onChange={e => setEditForm({ ...editForm, widthMm: parseInt(e.target.value) })} />
                                        x
                                        <input className="w-16 text-sm p-1 border rounded" placeholder="H" value={editForm.heightMm} onChange={e => setEditForm({ ...editForm, heightMm: parseInt(e.target.value) })} />
                                    </div>
                                </td>
                                <td className="px-6 py-4"><input className="w-20 text-sm p-1 border rounded" placeholder="Price" value={editForm.basePrice} onChange={e => setEditForm({ ...editForm, basePrice: parseFloat(e.target.value) })} /></td>
                                <td className="px-6 py-4">New</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={handleSave} className="p-1.5 text-primary-600 hover:bg-white rounded transition-colors"><Check className="w-4 h-4" /></button>
                                        <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-white rounded transition-colors"><X className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {sizes.map((size) => (
                            <tr key={size.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    {editingId === size.id ? (
                                        <input
                                            className="w-full p-1 border rounded"
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        />
                                    ) : (
                                        <div className="font-medium text-slate-900">{size.name}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{size.slug}</td>
                                <td className="px-6 py-4 text-slate-500">
                                    {editingId === size.id ? (
                                        <div className="flex items-center gap-1">
                                            <input className="w-16 p-1 border rounded" value={editForm.widthMm} onChange={e => setEditForm({ ...editForm, widthMm: parseInt(e.target.value) })} />
                                            x
                                            <input className="w-16 p-1 border rounded" value={editForm.heightMm} onChange={e => setEditForm({ ...editForm, heightMm: parseInt(e.target.value) })} />
                                        </div>
                                    ) : (
                                        `${size.widthMm}x${size.heightMm}`
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === size.id ? (
                                        <input className="w-20 p-1 border rounded" value={editForm.basePrice} onChange={e => setEditForm({ ...editForm, basePrice: parseFloat(e.target.value) })} />
                                    ) : (
                                        <span className="font-semibold">{size.basePrice} ₴</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {size.isActive ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">ACTIVE</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">INACTIVE</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {editingId === size.id ? (
                                            <>
                                                <button onClick={handleSave} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"><Check className="w-4 h-4" /></button>
                                                <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors"><X className="w-4 h-4" /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => handleEdit(size)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(size.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
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
