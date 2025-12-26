"use client";

import { useTranslation } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { Printer, Package, Truck, Gift, Sparkles } from "lucide-react";
import { useSettings } from "@/lib/settings-context";

interface PrintSize {
    id: number;
    name: string;
    slug: string;
    basePrice: number;
}

interface MagnetPrice {
    id: number;
    sizeSlug: string;
    price: number;
}

interface DeliveryOption {
    id: number;
    slug: string;
    name: string;
    price: number;
    description: string | null;
}

interface VolumeDiscount {
    id: number;
    printSizeId: number;
    minQuantity: number;
    price: number;
    printSize: PrintSize;
}

interface PricingData {
    sizes: PrintSize[];
    magnetPrices: MagnetPrice[];
    deliveryOptions: DeliveryOption[];
    discounts: VolumeDiscount[];
    giftThreshold?: { minAmount: number; isActive: boolean } | null;
}

const DELIVERY_TRANSLATIONS: any = {
    local: {
        uk: { name: 'Доставка по м. Дніпро', desc: "Доставка кур'єром по місту Дніпро" },
        ru: { name: 'Доставка по г. Днепр', desc: "Доставка курьером по городу Днепр" },
        en: { name: 'Delivery in Dnipro', desc: "Courier delivery in Dnipro city" },
    },
    novaposhta: {
        uk: { name: 'Нова Пошта', descPrefix: 'Доставка в інші міста України ', linkText: 'за тарифами Нової Пошти' },
        ru: { name: 'Новая Почта', descPrefix: 'Доставка в другие города Украины ', linkText: 'по тарифам Новой Почты' },
        en: { name: 'Nova Poshta', descPrefix: 'Delivery to other cities of Ukraine ', linkText: 'according to Nova Poshta tariffs' },
    },
    pickup: {
        uk: { name: 'Самовивіз' },
        ru: { name: 'Самовывоз' },
        en: { name: 'Pickup' },
    }
};

export default function PricingPage() {
    const { t, lang } = useTranslation();
    const { getSetting } = useSettings();
    const [data, setData] = useState<PricingData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/pricing')
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e31e24]"></div>
            </div>
        );
    }

    const getMagnetPrice = (sizeSlug: string) => {
        return data?.magnetPrices.find(mp => mp.sizeSlug === sizeSlug)?.price;
    };

    const getDiscounts = (sizeId: number) => {
        return data?.discounts.filter(d => d.printSizeId === sizeId).sort((a, b) => a.minQuantity - b.minQuantity) || [];
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-black text-[#4c4c4c] mb-2">
                        {t('pricing.title')}
                    </h1>
                    <p className="text-[#4c4c4c]/70">{t('pricing.subtitle')}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">

                    {/* Photo Printing Prices */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#009846] to-[#00a854] p-4 flex items-center gap-3">
                            <Printer className="w-6 h-6 text-white" />
                            <h2 className="text-lg font-bold text-white">{t('pricing.photo_print')}</h2>
                        </div>
                        <div className="p-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-slate-200">
                                        <th className="text-left py-2 font-bold text-slate-600">{t('pricing.format')}</th>
                                        <th className="text-center py-2 font-bold text-slate-600">&lt;100</th>
                                        <th className="text-center py-2 font-bold text-slate-600">&gt;100</th>
                                        <th className="text-center py-2 font-bold text-slate-600">&gt;200</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.sizes.map((size) => {
                                        const discounts = getDiscounts(size.id);
                                        const price100 = discounts.find(d => d.minQuantity <= 100)?.price || (size.basePrice * 0.9);
                                        const price200 = discounts.find(d => d.minQuantity <= 200 && d.minQuantity > 100)?.price || (size.basePrice * 0.8);

                                        return (
                                            <tr key={size.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="py-2.5 font-medium text-[#4c4c4c]">{size.name}</td>
                                                <td className="py-2.5 text-center font-semibold">{size.basePrice.toFixed(2)}</td>
                                                <td className="py-2.5 text-center font-semibold text-[#009846]">{price100.toFixed(2)}</td>
                                                <td className="py-2.5 text-center font-semibold text-[#e31e24]">{price200.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <p className="text-xs text-slate-500 mt-3 text-center">
                                {t('pricing.currency_note')}
                            </p>
                        </div>
                    </div>

                    {/* Magnet Prices */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#e31e24] to-[#ff4444] p-4 flex items-center gap-3">
                            <Gift className="w-6 h-6 text-white" />
                            <h2 className="text-lg font-bold text-white">{t('pricing.magnets')}</h2>
                        </div>
                        <div className="p-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-slate-200">
                                        <th className="text-left py-2 font-bold text-slate-600">{t('pricing.format')}</th>
                                        <th className="text-right py-2 font-bold text-slate-600">{t('pricing.price')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.magnetPrices.map((mp) => (
                                        <tr key={mp.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="py-2.5 font-medium text-[#4c4c4c]">{mp.sizeSlug}</td>
                                            <td className="py-2.5 text-right font-bold text-[#e31e24]">{mp.price.toFixed(2)} {t('general.currency')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="text-xs text-slate-500 mt-3 text-center">
                                {t('pricing.magnet_note')}
                            </p>
                        </div>
                    </div>

                    {/* Delivery */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#4c4c4c] to-[#666] p-4 flex items-center gap-3">
                            <Truck className="w-6 h-6 text-white" />
                            <h2 className="text-lg font-bold text-white">{t('pricing.delivery')}</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            {data?.deliveryOptions.map((option) => {
                                const translations = DELIVERY_TRANSLATIONS[option.slug]?.[lang as string] || DELIVERY_TRANSLATIONS[option.slug]?.['uk'];
                                let name = translations?.name || option.name;
                                let description = option.description;

                                // Logic for description override
                                if (option.slug === 'pickup') {
                                    description = getSetting('contact_address') || "м. Дніпро, вул. Європейська 8";
                                } else if (option.slug === 'local') {
                                    description = translations?.desc || description;
                                }

                                return (
                                    <div key={option.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                        <div className="pr-4">
                                            <div className="font-medium text-[#4c4c4c]">{name}</div>
                                            {option.slug === 'novaposhta' ? (
                                                <div className="text-xs text-slate-500">
                                                    {translations?.descPrefix || "Доставка в інші міста України "}
                                                    <a href="https://novaposhta.ua/delivery" target="_blank" rel="noopener noreferrer" className="text-[#e31e24] hover:underline font-medium">
                                                        {translations?.linkText || "за тарифами Нової Пошти"}
                                                    </a>
                                                </div>
                                            ) : (
                                                description && <div className="text-xs text-slate-500">{description}</div>
                                            )}
                                        </div>
                                        <div className="text-right whitespace-nowrap">
                                            {option.price > 0 ? (
                                                <span className="font-bold text-[#e31e24]">{option.price.toFixed(0)} {t('general.currency')}</span>
                                            ) : option.slug === 'pickup' ? (
                                                <span className="font-bold text-[#009846]">{t('checkout.free')}</span>
                                            ) : (
                                                <span className="text-sm text-slate-500">{t('pricing.by_tariff')}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Additional Services */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-white" />
                            <h2 className="text-lg font-bold text-white">{t('pricing.services')}</h2>
                        </div>
                        <div className="p-4">
                            <ul className="space-y-2 text-sm text-[#4c4c4c]">
                                <li className="flex items-start gap-2">
                                    <span className="text-[#009846] font-bold">•</span>
                                    {t('pricing.service_scan')}
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#009846] font-bold">•</span>
                                    {t('pricing.service_restore')}
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#009846] font-bold">•</span>
                                    {t('pricing.service_redeye')}
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#009846] font-bold">•</span>
                                    {t('pricing.service_collage')}
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#009846] font-bold">•</span>
                                    {t('pricing.service_documents')}
                                </li>
                            </ul>
                            <p className="text-xs text-slate-500 mt-3 text-center">
                                {t('pricing.contact_for_services')}
                            </p>
                        </div>
                    </div>

                </div>

                {/* Promo Banner */}
                {/* Promo Banner */}
                {data?.giftThreshold && data.giftThreshold.isActive && (
                    <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-100 p-6 rounded-2xl border-2 border-green-300 text-center">
                        <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-lg mb-2">
                            <Gift className="w-6 h-6" />
                            {t('pricing.promo_title')}
                        </div>
                        <p className="text-green-600">
                            {t('gift.promo_text').replace('{amount}', String(data.giftThreshold.minAmount))}
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
