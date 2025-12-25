
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const articles = await prisma.helpArticle.findMany({
            include: { translations: true },
            orderBy: { sortOrder: 'asc' }
        });
        return NextResponse.json(articles);
    } catch (error) {
        console.error("Error fetching articles:", error);
        return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { helpCategoryId, slug, sortOrder, translations } = body;

        const article = await prisma.helpArticle.create({
            data: {
                helpCategoryId,
                slug,
                sortOrder,
                translations: {
                    create: translations
                }
            }
        });

        return NextResponse.json(article);
    } catch (error) {
        console.error("Error creating article:", error);
        return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
    }
}
