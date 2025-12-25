"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Table } from "lucide-react";

export default function PricingPage() {
    const { t } = useTranslation();
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                setConfig(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f3f1e9]">
            <header className="bg-gradient-to-b from-[#00b352] to-[#009846] text-white py-16 mb-12 relative overflow-hidden shadow-lg">
                <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-5xl font-black mb-4 uppercase tracking-tight">{t('nav.pricing')}</h1>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto font-medium">
                        {t('Professional photo printing with high-quality Fuji materials. Choose your size and options below.')}
                    </p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </header>

            <div className="max-w-7xl mx-auto px-4 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {config?.sizes?.map((size: any) => (
                        <Card key={size.id} className="overflow-hidden border-[#c5b98e]/50 hover:shadow-xl transition-shadow bg-white rounded-2xl">
                            <CardHeader className="bg-[#f0ede4] border-b border-[#c5b98e]/30">
                                <CardTitle className="flex justify-between items-center">
                                    <span className="text-2xl font-black text-[#4c4c4c]">{size.name}</span>
                                    <span className="text-[#e31e24] text-2xl font-black">{size.basePrice} ₴</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="space-y-4">
                                    {size.discounts?.map((d: any) => (
                                        <li key={d.minQuantity} className="flex justify-between items-center p-3 rounded-lg bg-[#f9f8f4] border border-transparent hover:border-[#c5b98e]/30 transition-colors">
                                            <span className="text-[#4c4c4c] font-bold">{d.minQuantity}+ {t('prints')}</span>
                                            <span className="font-black text-[#009846]">{d.price} ₴</span>
                                        </li>
                                    ))}
                                    {size.discounts?.length === 0 && (
                                        <li className="text-sm text-[#4c4c4c]/40 italic text-center py-4">
                                            {t('No bulk discounts available')}
                                        </li>
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <section className="mt-24 max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black text-[#009846] mb-8 flex items-center gap-3 uppercase tracking-tight">
                        <div className="w-10 h-10 bg-[#009846] text-white rounded-lg flex items-center justify-center">
                            <Table className="w-6 h-6" />
                        </div>
                        {t('Extra Options')}
                    </h2>
                    <div className="bg-white rounded-2xl border border-[#c5b98e]/50 overflow-hidden shadow-lg">
                        <table className="w-full text-left">
                            <thead className="bg-[#c5b98e] text-white uppercase text-sm font-black">
                                <tr>
                                    <th className="px-8 py-5">{t('Option')}</th>
                                    <th className="px-8 py-5">{t('Price')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#c5b98e]/20">
                                {config?.options?.map((opt: any) => (
                                    <tr key={opt.id} className="hover:bg-[#f9f8f4] transition-colors">
                                        <td className="px-8 py-5 font-bold text-[#4c4c4c]">{t(opt.name)}</td>
                                        <td className="px-8 py-5 text-[#e31e24] font-black">+{opt.price} ₴</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
