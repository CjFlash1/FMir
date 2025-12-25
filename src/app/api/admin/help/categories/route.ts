
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { slug, translations } = body;

        const category = await prisma.helpCategory.create({
            data: {
                slug,
                translations: {
                    create: translations
                }
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const categories = await prisma.helpCategory.findMany({
            include: { translations: true },
            orderBy: { sortOrder: 'asc' }
        });
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}
