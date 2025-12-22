"use client";

import { useEffect, useState } from "react";
import { Cpu, HardDrive, Thermometer, Clock } from "lucide-react";

interface Stats {
    ram: {
        total: string;
        used: string;
        percentage: number;
    };
    uptime: string;
    platform: string;
    cpus: number;
    disk: string;
}

export function ServerStats() {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        const fetchStats = () => {
            fetch("/api/fujiadmin/stats")
                .then(res => res.json())
                .then(setStats)
                .catch(console.error);
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!stats) return <div className="h-24 flex items-center justify-center text-slate-400">Loading system stats...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-500">System RAM</span>
                    <Cpu className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-xl font-bold">{stats.ram.used} / {stats.ram.total}</div>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${stats.ram.percentage > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${stats.ram.percentage}%` }}
                    />
                </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-500">Disk Usage</span>
                    <HardDrive className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl font-bold">{stats.disk}</div>
                <div className="text-xs text-slate-400 mt-1">Platform: {stats.platform}</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-500">Nodes / CPUs</span>
                    <Thermometer className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xl font-bold">{stats.cpus} Cores</div>
                <div className="text-xs text-slate-400 mt-1">Status: Stable</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-500">Uptime</span>
                    <Clock className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-xl font-bold">{stats.uptime}</div>
                <div className="text-xs text-slate-400 mt-1">Last Restart: Unknown</div>
            </div>
        </div>
    );
}
