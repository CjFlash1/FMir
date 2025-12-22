import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PublicPage({ params }: { params: { slug: string } }) {
    const { slug } = params;

    const page = await prisma.page.findUnique({
        where: { slug, isActive: true }
    });

    if (!page) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                    {page.title}
                </h1>
            </header>

            <div
                className="prose prose-slate prose-lg max-w-none 
                prose-headings:font-bold prose-headings:text-slate-900
                prose-p:text-slate-600 prose-li:text-slate-600
                prose-a:text-primary-600 prose-a:font-semibold underline-offset-4"
                dangerouslySetInnerHTML={{ __html: page.content }}
            />
        </div>
    );
}

// Optional: Static params for performance if we know all pages. 
// For a CMS, it's usually dynamic or revalidated.
export const revalidate = 3600; // revalidate every hour
