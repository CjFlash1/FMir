"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, Save, X } from "lucide-react";

interface DeliveryOption {
    id: number;
    slug: string;
    name: string;
    price: number;
    description: string | null;
    isActive: boolean;
}

export default function DeliveryPage() {
    const { t } = useTranslation();
    const [items, setItems] = useState<DeliveryOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<Partial<DeliveryOption>>({});

    const fetchData = async () => {
        const res = await fetch('/api/fujiadmin/config/delivery?includeInactive=true');
        const data = await res.json();
        setItems(data);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleEdit = (item: DeliveryOption) => {
        setEditingId(item.id);
        setEditData({ ...item });
    };

    const handleSave = async () => {
        if (!editingId) return;
        await fetch('/api/fujiadmin/config/delivery', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editData),
        });
        setEditingId(null);
        fetchData();
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditData({});
    };

    if (loading) return <div className="animate-pulse">{t('Loading')}...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900">{t('config.delivery')}</h2>
                <p className="text-sm text-slate-500">{t('config.delivery_desc')}</p>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">{t('Name')}</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">{t('Description')}</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">{t('pricing.price')} ({t('general.currency')})</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">{t('Status')}</th>
                            <th className="text-right py-3 px-4 font-semibold text-slate-600">{t('Actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
                                <td className="py-3 px-4">
                                    {editingId === item.id ? (
                                        <Input
                                            value={editData.name || ''}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        />
                                    ) : (
                                        <div>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-xs text-slate-400">{item.slug}</div>
                                        </div>
                                    )}
                                </td>
                                <td className="py-3 px-4">
                                    {editingId === item.id ? (
                                        <Input
                                            value={editData.description || ''}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                        />
                                    ) : (
                                        <span className="text-sm text-slate-500">{item.description || '-'}</span>
                                    )}
                                </td>
                                <td className="py-3 px-4">
                                    {editingId === item.id ? (
                                        <Input
                                            type="number"
                                            step="1"
                                            value={editData.price || 0}
                                            onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                                            className="w-28"
                                        />
                                    ) : (
                                        <span className={`font-bold ${item.price > 0 ? 'text-[#e31e24]' : 'text-[#009846]'}`}>
                                            {item.price > 0 ? item.price.toFixed(0) : t('checkout.free')}
                                        </span>
                                    )}
                                </td>
                                <td className="py-3 px-4">
                                    {editingId === item.id ? (
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={editData.isActive}
                                                onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
                                            />
                                            <span className="text-sm text-slate-600">{editData.isActive ? t('Active') : t('Inactive')}</span>
                                        </div>
                                    ) : (
                                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {item.isActive ? t('Active') : t('Inactive')}
                                        </div>
                                    )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                    {editingId === item.id ? (
                                        <div className="flex gap-2 justify-end">
                                            <Button size="sm" onClick={handleSave}><Save className="w-4 h-4" /></Button>
                                            <Button size="sm" variant="outline" onClick={handleCancel}><X className="w-4 h-4" /></Button>
                                        </div>
                                    ) : (
                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                    <strong>📦 Примечание:</strong> Цена 0 означает, что стоимость оплачивается клиентом отдельно (например, тарифы Новой Почты) или услуга бесплатная (самовывоз). Вы можете отключать способы доставки, и они исчезнут из корзины.
                </p>
            </div>
        </div>
    );
}
