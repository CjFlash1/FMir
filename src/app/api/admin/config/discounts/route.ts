import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const sizeId = searchParams.get("sizeId");

    if (!sizeId) {
        const allDiscounts = await prisma.volumeDiscount.findMany({
            include: { printSize: true }
        });
        return NextResponse.json(allDiscounts);
    }

    const discounts = await prisma.volumeDiscount.findMany({
        where: { printSizeId: parseInt(sizeId) },
        orderBy: { minQuantity: 'asc' }
    });
    return NextResponse.json(discounts);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const discount = await prisma.volumeDiscount.create({
            data: {
                printSizeId: parseInt(body.printSizeId),
                minQuantity: parseInt(body.minQuantity),
                price: parseFloat(body.price),
            }
        });
        return NextResponse.json(discount);
    } catch (e) {
        return NextResponse.json({ error: "Failed to create discount" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const discount = await prisma.volumeDiscount.update({
            where: { id: body.id },
            data: {
                minQuantity: parseInt(body.minQuantity),
                price: parseFloat(body.price),
            }
        });
        return NextResponse.json(discount);
    } catch (e) {
        return NextResponse.json({ error: "Failed to update discount" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
        await prisma.volumeDiscount.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete discount" }, { status: 500 });
    }
}
