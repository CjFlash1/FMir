import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const translations = await prisma.translation.findMany({
        orderBy: [
            { key: 'asc' },
            { lang: 'asc' }
        ]
    });
    return NextResponse.json(translations);
}

export async function POST(req: Request) {
    const data = await req.json();
    const translation = await prisma.translation.upsert({
        where: {
            lang_key: {
                lang: data.lang,
                key: data.key,
            }
        },
        update: {
            value: data.value,
        },
        create: {
            lang: data.lang,
            key: data.key,
            value: data.value,
        }
    });
    return NextResponse.json(translation);
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.translation.delete({
        where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
}
