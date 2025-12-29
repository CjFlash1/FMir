"use client";

import { ShoppingBag, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { ServerStats } from "@/components/server-stats";
import { useTranslation } from "@/lib/i18n";
import { useState, useEffect } from "react";

interface OrderStats {
    draft: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    total: number;
    recentOrders: number;
    totalRevenue: number;
}

export default function AdminDashboard() {
    const { t } = useTranslation();
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/fujiadmin/orders/stats")
            .then(res => res.json())
            .then(data => {
                setStats(data.stats);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load stats:", err);
                setLoading(false);
            });
    }, []);

    const statCards = stats ? [
        {
            label: t("admin.stats.pending"),
            value: stats.pending,
            subtitle: t("admin.stats.new_orders"),
            icon: AlertCircle,
            iconBg: "bg-red-50",
            iconColor: "text-red-600",
            valueColor: "text-red-600"
        },
        {
            label: t("admin.stats.processing"),
            value: stats.processing,
            subtitle: t("admin.stats.in_progress"),
            icon: Clock,
            iconBg: "bg-orange-50",
            iconColor: "text-orange-600",
            valueColor: "text-orange-600"
        },
        {
            label: t("admin.stats.completed"),
            value: stats.completed,
            subtitle: t("admin.stats.done"),
            icon: CheckCircle,
            iconBg: "bg-green-50",
            iconColor: "text-green-600",
            valueColor: "text-green-600"
        },
        {
            label: t("admin.stats.draft"),
            value: stats.draft,
            subtitle: t("admin.stats.not_submitted"),
            icon: FileText,
            iconBg: "bg-slate-100",
            iconColor: "text-slate-500",
            valueColor: "text-slate-500"
        },
    ] : [];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("admin.dashboard")}</h1>

            <ServerStats />

            {/* Order Statistics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {loading ? (
                    // Loading skeletons
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                            <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
                            <div className="h-3 bg-slate-100 rounded w-20"></div>
                        </div>
                    ))
                ) : (
                    statCards.map((card, index) => (
                        <div key={index} className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                                <div className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</div>
                                <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
                            </div>
                            <div className={`p-3 ${card.iconBg} rounded-lg`}>
                                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Summary Row */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <ShoppingBag className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{t("admin.stats.total_orders")}</p>
                                <div className="text-2xl font-bold text-slate-900">{stats.total - stats.draft}</div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <Clock className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{t("admin.stats.this_week")}</p>
                                <div className="text-2xl font-bold text-slate-900">+{stats.recentOrders}</div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-50 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{t("admin.stats.revenue")}</p>
                                <div className="text-2xl font-bold text-slate-900">{stats.totalRevenue.toFixed(2)} {t("general.currency")}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
