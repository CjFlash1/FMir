import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Bulk update order statuses
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { orderIds, status } = body;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });
        }

        const validStatuses = ["DRAFT", "PENDING", "PROCESSING", "COMPLETED", "CANCELLED"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Update all specified orders
        const result = await prisma.order.updateMany({
            where: {
                id: { in: orderIds.map((id: string | number) => parseInt(String(id))) }
            },
            data: { status }
        });

        return NextResponse.json({
            success: true,
            updatedCount: result.count,
            newStatus: status
        });
    } catch (error) {
        console.error("Bulk status update error:", error);
        return NextResponse.json({ error: "Failed to update statuses" }, { status: 500 });
    }
}
