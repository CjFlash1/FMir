import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { HelpArticleViewer } from "@/components/help-article-viewer";

const prisma = new PrismaClient();

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function HelpPage({ params }: PageProps) {
    const { slug } = await params;

    const article = await prisma.helpArticle.findUnique({
        where: { slug },
        include: { translations: true }
    });

    if (!article || !article.isActive) {
        notFound();
    }

    return <HelpArticleViewer article={article} />;
}
