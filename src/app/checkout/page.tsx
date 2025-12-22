"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export default function CheckoutPage() {
    const router = useRouter();
    const { items, clearCart, config } = useCartStore();
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        deliveryAddress: "",
        deliveryMethod: "PICKUP",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderComplete, setOrderComplete] = useState<string | null>(null);

    // Total calculation with dynamic pricing
    const calculateItemUnitPrice = (item: any) => {
        if (!config) return 0;
        const sizeObj = config.sizes.find(s => s.name === item.options.size);
        if (!sizeObj) return 0;

        let unitPrice = sizeObj.basePrice;

        // Apply volume discount
        if (sizeObj.discounts && sizeObj.discounts.length > 0) {
            const applicableDiscount = [...sizeObj.discounts]
                .sort((a, b) => b.minQuantity - a.minQuantity)
                .find(d => item.options.quantity >= d.minQuantity);

            if (applicableDiscount) {
                unitPrice = applicableDiscount.price;
            }
        }

        // Add option prices
        Object.entries(item.options.options || {}).forEach(([slug, isActive]) => {
            if (isActive) {
                const opt = config.options.find(o => o.slug === slug);
                if (opt) unitPrice += opt.price;
            }
        });

        return unitPrice;
    };

    const calculateItemTotal = (item: any) => {
        return calculateItemUnitPrice(item) * item.options.quantity;
    };

    const totalAmount = items.reduce((acc, item) => acc + calculateItemTotal(item), 0);

    const activeGift = config?.gifts
        ?.filter(g => totalAmount >= g.minAmount)
        ?.sort((a, b) => b.minAmount - a.minAmount)[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Upload unique files
            const uploadedFilesMap = new Map<File, string>(); // File object -> serverFileName
            const uniqueFiles = Array.from(new Set(items.map(i => i.file).filter(Boolean))) as File[];

            for (const file of uniqueFiles) {
                const formData = new FormData();
                formData.append("file", file);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                });

                if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`);
                const { fileName } = await uploadRes.json();
                uploadedFilesMap.set(file, fileName);
            }

            // 2. Create Order
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer: formData,
                    items: items.map(item => ({
                        id: item.id,
                        options: item.options,
                        fileName: item.file?.name,
                        serverFileName: item.file ? uploadedFilesMap.get(item.file) : null,
                        priceSnapshot: calculateItemUnitPrice(item),
                    })),
                    total: totalAmount
                }),
            });

            if (!response.ok) throw new Error("Order failed");

            const data = await response.json();
            setOrderComplete(data.orderNumber);
            clearCart();
        } catch (error) {
            console.error(error);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (orderComplete) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center p-6">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Confirmed!</h2>
                    <p className="text-slate-600 mb-6">
                        Your order <span className="font-mono font-medium text-slate-900">#{orderComplete}</span> has been placed successfully.
                    </p>
                    <Button onClick={() => router.push("/")} className="w-full">
                        Return Home
                    </Button>
                </Card>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <p className="text-slate-500 mb-4">Your cart is empty.</p>
                <Link href="/upload">
                    <Button>Upload Photos</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/upload" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Upload
                </Link>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Shipping & Contact</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Full Name</label>
                                            <Input
                                                required
                                                placeholder="Іван Петренко"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Phone Number</label>
                                            <Input
                                                required
                                                placeholder="+380..."
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Address (Optional)</label>
                                        <Input
                                            type="email"
                                            placeholder="email@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Delivery Method</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, deliveryMethod: "PICKUP" })}
                                                className={`p-4 border rounded-lg text-center transition-colors ${formData.deliveryMethod === "PICKUP"
                                                    ? "border-primary-600 bg-primary-50 text-primary-900 font-medium"
                                                    : "border-slate-200 hover:border-slate-300"
                                                    }`}
                                            >
                                                Pickup
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, deliveryMethod: "POST" })}
                                                className={`p-4 border rounded-lg text-center transition-colors ${formData.deliveryMethod === "POST"
                                                    ? "border-primary-600 bg-primary-50 text-primary-900 font-medium"
                                                    : "border-slate-200 hover:border-slate-300"
                                                    }`}
                                            >
                                                Nova Poshta
                                            </button>
                                        </div>
                                    </div>

                                    {formData.deliveryMethod === "POST" && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Address / Branch</label>
                                            <Input
                                                required
                                                placeholder="City, Branch #3..."
                                                value={formData.deliveryAddress}
                                                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Application Summary */}
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('checkout.summary')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    {items.map(item => (
                                        <div key={item.id} className="flex justify-between text-xs text-slate-600">
                                            <span>
                                                {item.options.size} {item.options.paper} x{item.options.quantity}
                                                {Object.keys(item.options.options || {}).length > 0 && " (+)"}
                                            </span>
                                            <span>{calculateItemTotal(item).toFixed(2)} ₴</span>
                                        </div>
                                    ))}
                                    {activeGift && (
                                        <div className="flex justify-between text-sm font-medium text-green-600 bg-green-50 p-2 rounded border border-green-200">
                                            <span>{t('checkout.bonus')}: {activeGift.giftName}</span>
                                            <span>{t('checkout.free')}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t pt-4 flex justify-between items-center">
                                    <span className="font-semibold text-lg">{t('checkout.total')}</span>
                                    <span className="font-bold text-xl text-primary-600">{totalAmount.toFixed(2)} ₴</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    size="lg"
                                    type="submit"
                                    form="checkout-form"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('common.processing') || 'Processing...'}
                                        </>
                                    ) : (
                                        t('checkout.placeOrder')
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
