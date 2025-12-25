
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const categoryId = parseInt(id);
        const body = await request.json();
        const { slug, translations } = body;

        // Transaction to update category and its translations
        const category = await prisma.$transaction(async (tx) => {
            // Update base category fields
            const updatedCat = await tx.helpCategory.update({
                where: { id: categoryId },
                data: { slug }
            });

            // Update translations (upsert logic for each lang)
            for (const t of translations) {
                // Find existing translation ID for this category + lang
                const existing = await tx.helpCategoryTranslation.findFirst({
                    where: {
                        helpCategoryId: categoryId,
                        lang: t.lang
                    }
                });

                if (existing) {
                    await tx.helpCategoryTranslation.update({
                        where: { id: existing.id },
                        data: { name: t.name }
                    });
                } else {
                    await tx.helpCategoryTranslation.create({
                        data: {
                            helpCategoryId: categoryId,
                            lang: t.lang,
                            name: t.name
                        }
                    });
                }
            }
            return updatedCat;
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.helpCategory.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
