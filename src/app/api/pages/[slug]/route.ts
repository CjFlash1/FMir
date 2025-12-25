import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "uk";

    try {
        // Use raw query to bypass stale client mapping issues (EPERM prevented generate)
        const pages = await prisma.$queryRaw<any[]>`
            SELECT * FROM "Page" 
            WHERE "slug" = ${slug} AND "lang" = ${lang}
            LIMIT 1
        `;

        let page = pages[0];

        if (!page) {
            // Fallback to any version of this slug
            const fallbacks = await prisma.$queryRaw<any[]>`
                SELECT * FROM "Page" WHERE "slug" = ${slug} LIMIT 1
            `;
            page = fallbacks[0];
        }

        if (!page) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        // SQLite booleans are 0/1, convert to standard boolean
        return NextResponse.json({
            ...page,
            isActive: page.isActive === 1 || page.isActive === true
        });
    } catch (error) {
        console.error("API Page Error:", error);
        return NextResponse.json({ error: "Failed to fetch page", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
