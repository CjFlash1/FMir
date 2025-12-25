
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");

        if (!categoryId) {
            return NextResponse.json({ error: "Category ID required" }, { status: 400 });
        }

        const articles = await prisma.helpArticle.findMany({
            where: { helpCategoryId: parseInt(categoryId) },
            include: { translations: true },
            orderBy: { sortOrder: 'asc' }
        });

        return NextResponse.json(articles);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
    }
}
