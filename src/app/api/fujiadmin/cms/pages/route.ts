import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const pages = await prisma.page.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(pages);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, slug, content, description, isActive } = body;

        const page = await prisma.page.create({
            data: {
                title,
                slug,
                content,
                description,
                isActive: isActive ?? true
            }
        });

        return NextResponse.json(page);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Slug must be unique" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, title, slug, content, description, isActive } = body;

        const page = await prisma.page.update({
            where: { id: Number(id) },
            data: {
                title,
                slug,
                content,
                description,
                isActive
            }
        });

        return NextResponse.json(page);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        await prisma.page.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
    }
}
