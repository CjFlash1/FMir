"use client";

import { Users, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";
import { ServerStats } from "@/components/server-stats";

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>

            <ServerStats />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                        <div className="text-2xl font-bold text-slate-900">$45,231</div>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                            <TrendingUp className="w-3 h-3 mr-1" /> +20.1% from last month
                        </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                </div>

                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Orders</p>
                        <div className="text-2xl font-bold text-slate-900">+2350</div>
                        <p className="text-xs text-slate-500 mt-1">
                            +180 this week
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                    </div>
                </div>

                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Active Users</p>
                        <div className="text-2xl font-bold text-slate-900">+12,234</div>
                        <p className="text-xs text-slate-500 mt-1">
                            +19 signed up today
                        </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <Users className="w-6 h-6 text-purple-600" />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-medium mb-4">Overview</h3>
                    <div className="h-[200px] flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed">
                        Chart Placeholder (Recharts)
                    </div>
                </div>
                <div className="col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-medium mb-4">Recent Sales</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center">
                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                                    <span className="text-xs font-bold text-slate-600">OM</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Order #{1000 + i}</p>
                                    <p className="text-xs text-slate-500">Oleg M. • 10x15 Glossy (50)</p>
                                </div>
                                <div className="ml-auto font-medium text-sm">+$24.00</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
