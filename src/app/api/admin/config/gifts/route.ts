import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const gifts = await prisma.giftThreshold.findMany({
        orderBy: { minAmount: 'asc' }
    });
    return NextResponse.json(gifts);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const gift = await prisma.giftThreshold.create({
            data: {
                minAmount: parseFloat(body.minAmount),
                giftName: body.giftName,
                isActive: body.isActive ?? true,
            }
        });
        return NextResponse.json(gift);
    } catch (e) {
        return NextResponse.json({ error: "Failed to create gift threshold" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const gift = await prisma.giftThreshold.update({
            where: { id: body.id },
            data: {
                minAmount: parseFloat(body.minAmount),
                giftName: body.giftName,
                isActive: body.isActive,
            }
        });
        return NextResponse.json(gift);
    } catch (e) {
        return NextResponse.json({ error: "Failed to update gift threshold" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
        await prisma.giftThreshold.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete gift threshold" }, { status: 500 });
    }
}
