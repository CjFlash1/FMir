import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { headers } from "next/headers"; // Used to guess lang or we rely on client component for strict lang

const prisma = new PrismaClient();

// We need a server component to fetch the articles for the sidebar.
// But we also need to know the current language. 
// For simplicity in this layout, we'll fetch all translations and let a Client component handle the filtering/display of the sidebar based on current i18n context.
// OR we can make this layout generic and client-side heavy for the sidebar?
// Better: Fetch data here, pass to Client Sidebar.

import { HelpSidebar } from "@/components/help-sidebar";

export default async function HelpLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Fetch all active articles, sorted
    const articles = await prisma.helpArticle.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { translations: true }
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 capitalize">Help Center</h1>
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-1/4">
                    <HelpSidebar articles={articles} />
                </aside>
                <main className="w-full md:w-3/4 bg-white p-6 rounded-lg shadow-sm border border-slate-200 min-h-[500px]">
                    {children}
                </main>
            </div>
        </div>
    );
}
