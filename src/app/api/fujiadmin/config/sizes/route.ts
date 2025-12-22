import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const sizes = await prisma.printSize.findMany({
        orderBy: { basePrice: 'asc' }
    });
    return NextResponse.json(sizes);
}

export async function POST(req: Request) {
    const data = await req.json();
    const size = await prisma.printSize.create({
        data: {
            name: data.name,
            slug: data.slug,
            widthMm: data.widthMm,
            heightMm: data.heightMm,
            basePrice: data.basePrice,
            isActive: data.isActive ?? true,
        }
    });
    return NextResponse.json(size);
}

export async function PUT(req: Request) {
    const data = await req.json();
    const size = await prisma.printSize.update({
        where: { id: data.id },
        data: {
            name: data.name,
            slug: data.slug,
            widthMm: data.widthMm,
            heightMm: data.heightMm,
            basePrice: data.basePrice,
            isActive: data.isActive,
        }
    });
    return NextResponse.json(size);
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.printSize.delete({
        where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
}
