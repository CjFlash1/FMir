import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get("includeInactive") === "true";

        const deliveryOptions = await prisma.deliveryOption.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: { id: 'asc' }
        });
        return NextResponse.json(deliveryOptions);
    } catch (error) {
        console.error("Error fetching delivery options:", error);
        return NextResponse.json([]);
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const updated = await prisma.deliveryOption.update({
            where: { id: body.id },
            data: {
                name: body.name,
                price: parseFloat(body.price),
                description: body.description,
                isActive: body.isActive,
            }
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating delivery option:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
