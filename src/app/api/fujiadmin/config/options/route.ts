import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const options = await prisma.printOption.findMany();
    return NextResponse.json(options);
}

export async function POST(req: Request) {
    const data = await req.json();
    const option = await prisma.printOption.create({
        data: {
            name: data.name,
            slug: data.slug,
            priceType: data.priceType,
            price: data.price,
            isActive: data.isActive ?? true,
        }
    });
    return NextResponse.json(option);
}

export async function PUT(req: Request) {
    const data = await req.json();
    const option = await prisma.printOption.update({
        where: { id: data.id },
        data: {
            name: data.name,
            slug: data.slug,
            priceType: data.priceType,
            price: data.price,
            isActive: data.isActive,
        }
    });
    return NextResponse.json(option);
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.printOption.delete({
        where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
}
