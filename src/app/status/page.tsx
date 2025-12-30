"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Search, Package, Calendar, CreditCard } from "lucide-react";
import Link from "next/link";

export default function StatusPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [orderNumber, setOrderNumber] = useState("");
    const [result, setResult] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/orders/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, orderNumber }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Order not found");
            } else {
                setResult(data);
            }
        } catch (err) {
            setError("Failed to connect to server");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'PROCESSING': return 'bg-blue-100 text-blue-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-slate-100 text-slate-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f1e9] pt-24 pb-12 px-4">
            <div className="max-w-md mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900">{t('nav.status') || "Перевірка замовлення"}</h1>
                    <p className="text-slate-600 mt-2">{t('status.desc') || "Введіть номер замовлення та email для перевірки статусу"}</p>
                </div>

                <Card className="bg-white/80 backdrop-blur border-slate-200/60 shadow-lg">
                    <CardHeader>
                        <CardTitle>{t('status.track') || "Знайти замовлення"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCheck} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('checkout.order_number') || "Номер замовлення"}</label>
                                <Input
                                    placeholder="10001"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('checkout.email') || "Email"}</label>
                                <Input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                                {t('status.check_btn') || "Перевірити"}
                            </Button>
                        </form>

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                                {error}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {result && (
                    <Card className="animate-in fade-in slide-in-from-bottom-4 border-l-4 border-l-[#009846]">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">#{result.orderNumber}</CardTitle>
                                    <CardDescription className="flex items-center gap-1 mt-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(result.createdAt).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(result.status)}`}>
                                    {result.status}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm py-2 border-b">
                                <span className="text-slate-500">{t('checkout.total') || "Сума"}:</span>
                                <span className="font-bold text-lg">{result.totalAmount} ₴</span>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('nav.items') || "Товари"}:</p>
                                <ul className="space-y-1">
                                    {result.items.map((item: any) => (
                                        <li key={item.id} className="text-sm flex justify-between">
                                            <span>{item.quantity}x {item.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="text-center">
                    <Link href="/" className="text-sm text-slate-500 hover:underline">
                        {t('checkout.return_home') || "На головну"}
                    </Link>
                </div>
            </div>
        </div>
    );
}
