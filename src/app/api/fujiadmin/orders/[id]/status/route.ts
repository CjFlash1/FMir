import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { status } = body;

        const order = await prisma.order.update({
            where: { id: parseInt(params.id) },
            data: { status }
        });

        return NextResponse.json({ success: true, status: order.status });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}
