
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { helpCategoryId, slug, sortOrder, translations } = body;
        const articleId = parseInt(id);

        // Update article fields
        const article = await prisma.helpArticle.update({
            where: { id: articleId },
            data: {
                helpCategoryId,
                slug,
                sortOrder,
            }
        });

        // Update translations
        // Strategy: Delete existing and recreate (simplest) or Upsert.
        // For now, let's try upserting or just updating if they exist.
        // Easiest reliable way: Transaction or just Promise.all

        await prisma.helpArticleTranslation.deleteMany({
            where: { helpArticleId: articleId }
        });

        await prisma.helpArticleTranslation.createMany({
            data: translations.map((t: any) => ({
                helpArticleId: articleId,
                lang: t.lang,
                title: t.title,
                content: t.content
            }))
        });

        return NextResponse.json(article);
    } catch (error) {
        console.error("Error updating article:", error);
        return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.helpArticle.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting article:", error);
        return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
    }
}
