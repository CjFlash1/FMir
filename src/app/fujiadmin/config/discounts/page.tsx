"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Save } from "lucide-react";

export default function DiscountsConfig() {
    const [discounts, setDiscounts] = useState<any[]>([]);
    const [sizes, setSizes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null);
    const [newDiscount, setNewDiscount] = useState({ printSizeId: "", minQuantity: "", price: "" });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [dRes, sRes] = await Promise.all([
                fetch("/api/fujiadmin/config/discounts"),
                fetch("/api/fujiadmin/config/sizes")
            ]);
            setDiscounts(await dRes.json());
            setSizes(await sRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (discount: any) => {
        setSaving(discount.id);
        try {
            await fetch("/api/fujiadmin/config/discounts", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(discount),
            });
            fetchInitialData();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(null);
        }
    };

    const handleCreate = async () => {
        if (!newDiscount.printSizeId || !newDiscount.minQuantity || !newDiscount.price) return;
        setSaving(0);
        try {
            await fetch("/api/fujiadmin/config/discounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newDiscount),
            });
            setNewDiscount({ printSizeId: "", minQuantity: "", price: "" });
            fetchInitialData();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`/api/fujiadmin/config/discounts?id=${id}`, { method: "DELETE" });
            fetchInitialData();
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
            <h1 className="text-2xl font-bold">Volume Discounts</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Add New Discount Tier</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-semibold uppercase text-slate-500">Print Size</label>
                        <select
                            className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={newDiscount.printSizeId}
                            onChange={(e) => setNewDiscount({ ...newDiscount, printSizeId: e.target.value })}
                        >
                            <option value="">Select Size...</option>
                            {sizes.map(s => (
                                <option key={s.id} value={s.id}>{s.name} (Base: {s.basePrice}₴)</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-32 space-y-2">
                        <label className="text-xs font-semibold uppercase text-slate-500">Min Qty</label>
                        <Input
                            type="number"
                            placeholder="e.g. 51"
                            value={newDiscount.minQuantity}
                            onChange={(e) => setNewDiscount({ ...newDiscount, minQuantity: e.target.value })}
                        />
                    </div>
                    <div className="w-32 space-y-2">
                        <label className="text-xs font-semibold uppercase text-slate-500">New price (₴)</label>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 5.50"
                            value={newDiscount.price}
                            onChange={(e) => setNewDiscount({ ...newDiscount, price: e.target.value })}
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
                        {discounts.map((discount) => (
                            <div key={discount.id} className="flex gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex-1">
                                    <div className="text-sm font-medium">{discount.printSize?.name}</div>
                                    <div className="text-xs text-slate-500">Base Price: {discount.printSize?.basePrice} ₴</div>
                                </div>
                                <div className="w-32">
                                    <div className="text-xs font-semibold uppercase text-slate-500 mb-1">Min Qty</div>
                                    <Input
                                        type="number"
                                        value={discount.minQuantity}
                                        onChange={(e) => setDiscounts(discounts.map(d => d.id === discount.id ? { ...d, minQuantity: e.target.value } : d))}
                                    />
                                </div>
                                <div className="w-32">
                                    <div className="text-xs font-semibold uppercase text-slate-500 mb-1">New Price</div>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={discount.price}
                                        onChange={(e) => setDiscounts(discounts.map(d => d.id === discount.id ? { ...d, price: e.target.value } : d))}
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-5">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleUpdate(discount)}
                                        disabled={saving === discount.id}
                                    >
                                        {saving === discount.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500"
                                        onClick={() => handleDelete(discount.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {discounts.length === 0 && (
                            <p className="text-center text-slate-500 py-4">No volume discounts defined yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
