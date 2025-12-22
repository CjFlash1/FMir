import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const papers = await prisma.paperType.findMany();
    return NextResponse.json(papers);
}

export async function POST(req: Request) {
    const data = await req.json();
    const paper = await prisma.paperType.create({
        data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            isActive: data.isActive ?? true,
        }
    });
    return NextResponse.json(paper);
}

export async function PUT(req: Request) {
    const data = await req.json();
    const paper = await prisma.paperType.update({
        where: { id: data.id },
        data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            isActive: data.isActive,
        }
    });
    return NextResponse.json(paper);
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.paperType.delete({
        where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
}
