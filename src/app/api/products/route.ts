import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const [sizes, papers, options, gifts] = await Promise.all([
            prisma.printSize.findMany({
                where: { isActive: true },
                include: { discounts: true },
                orderBy: { basePrice: 'asc' }
            }),
            prisma.paperType.findMany({ where: { isActive: true } }),
            prisma.printOption.findMany({ where: { isActive: true } }),
            prisma.giftThreshold.findMany({ where: { isActive: true }, orderBy: { minAmount: 'asc' } }),
        ]);

        return NextResponse.json({ sizes, papers, options, gifts });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
