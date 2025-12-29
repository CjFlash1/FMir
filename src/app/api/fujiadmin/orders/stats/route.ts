import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Count orders by status
        const [draft, pending, processing, completed, cancelled, total] = await Promise.all([
            prisma.order.count({ where: { status: "DRAFT" } }),
            prisma.order.count({ where: { status: "PENDING" } }),
            prisma.order.count({ where: { status: "PROCESSING" } }),
            prisma.order.count({ where: { status: "COMPLETED" } }),
            prisma.order.count({ where: { status: "CANCELLED" } }),
            prisma.order.count(),
        ]);

        // Get recent orders (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const recentOrders = await prisma.order.count({
            where: {
                createdAt: { gte: weekAgo },
                status: { not: "DRAFT" }
            }
        });

        // Calculate total revenue (excluding drafts and cancelled)
        const revenueResult = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: {
                status: { in: ["PENDING", "PROCESSING", "COMPLETED"] }
            }
        });

        return NextResponse.json({
            stats: {
                draft,
                pending,
                processing,
                completed,
                cancelled,
                total,
                recentOrders,
                totalRevenue: revenueResult._sum.totalAmount || 0
            }
        });
    } catch (error) {
        console.error("Error fetching order stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
