import { NextResponse } from "next/server";
import si from "systeminformation";

export async function GET() {
    try {
        const [mem, cpu, osInfo, fsSize] = await Promise.all([
            si.mem(),
            si.cpu(),
            si.osInfo(),
            si.fsSize()
        ]);

        const totalGB = (mem.total / 1024 / 1024 / 1024).toFixed(1) + " GB";
        const usedGB = (mem.active / 1024 / 1024 / 1024).toFixed(1) + " GB";
        const ramPercentage = Math.round((mem.active / mem.total) * 100);

        // Calculate disk usage (usually root or first drive)
        const disk = fsSize[0] ? `${(fsSize[0].used / 1024 / 1024 / 1024).toFixed(1)} / ${(fsSize[0].size / 1024 / 1024 / 1024).toFixed(1)} GB (${fsSize[0].use}%)` : "Unknown";

        // Uptime in human readable format
        const uptimeSeconds = si.time().uptime;
        const hours = Math.floor(uptimeSeconds / 3600);
        const mins = Math.floor((uptimeSeconds % 3600) / 60);
        const uptimeStr = `${hours}h ${mins}m`;

        return NextResponse.json({
            ram: {
                total: totalGB,
                used: usedGB,
                percentage: ramPercentage
            },
            uptime: uptimeStr,
            platform: osInfo.platform,
            cpus: cpu.cores,
            disk: disk
        });
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
