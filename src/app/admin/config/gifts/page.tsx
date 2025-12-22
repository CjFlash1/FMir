"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Save } from "lucide-react";

export default function GiftsConfig() {
    const [gifts, setGifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null);
    const [newGift, setNewGift] = useState({ minAmount: "", giftName: "", isActive: true });

    useEffect(() => {
        fetchGifts();
    }, []);

    const fetchGifts = async () => {
        try {
            const res = await fetch("/api/admin/config/gifts");
            const data = await res.json();
            setGifts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (gift: any) => {
        setSaving(gift.id);
        try {
            await fetch("/api/admin/config/gifts", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(gift),
            });
            fetchGifts();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(null);
        }
    };

    const handleCreate = async () => {
        if (!newGift.minAmount || !newGift.giftName) return;
        setSaving(0);
        try {
            await fetch("/api/admin/config/gifts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newGift),
            });
            setNewGift({ minAmount: "", giftName: "", isActive: true });
            fetchGifts();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`/api/admin/config/gifts?id=${id}`, { method: "DELETE" });
            fetchGifts();
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

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Gift Thresholds</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Add New Gift</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-semibold uppercase text-slate-500">Min Order Amount (₴)</label>
                        <Input
                            type="number"
                            placeholder="e.g. 1000"
                            value={newGift.minAmount}
                            onChange={(e) => setNewGift({ ...newGift, minAmount: e.target.value })}
                        />
                    </div>
                    <div className="flex-[2] space-y-2">
                        <label className="text-xs font-semibold uppercase text-slate-500">Gift Name / Bonus Description</label>
                        <Input
                            placeholder="e.g. Free 10x15 Print, 10% Off Account..."
                            value={newGift.giftName}
                            onChange={(e) => setNewGift({ ...newGift, giftName: e.target.value })}
                        />
                    </div>
                    <Button onClick={handleCreate} disabled={saving === 0}>
                        {saving === 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        Add
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {gifts.map((gift) => (
                            <div key={gift.id} className="flex gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex-1">
                                    <Input
                                        type="number"
                                        value={gift.minAmount}
                                        onChange={(e) => setGifts(gifts.map(g => g.id === gift.id ? { ...g, minAmount: e.target.value } : g))}
                                    />
                                </div>
                                <div className="flex-[2]">
                                    <Input
                                        value={gift.giftName}
                                        onChange={(e) => setGifts(gifts.map(g => g.id === gift.id ? { ...g, giftName: e.target.value } : g))}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={gift.isActive}
                                        onChange={(e) => {
                                            const updated = { ...gift, isActive: e.target.checked };
                                            setGifts(gifts.map(g => g.id === gift.id ? updated : g));
                                            handleUpdate(updated);
                                        }}
                                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
                                    />
                                    <span className="text-sm text-slate-500">Active</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleUpdate(gift)}
                                    disabled={saving === gift.id}
                                >
                                    {saving === gift.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500"
                                    onClick={() => handleDelete(gift.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {gifts.length === 0 && (
                            <p className="text-center text-slate-500 py-4">No gift thresholds defined yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
