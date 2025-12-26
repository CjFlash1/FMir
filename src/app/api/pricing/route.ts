import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Public API for getting pricing data
export async function GET() {
    try {
        const [sizes, magnetPrices, deliveryOptions, discounts, giftThreshold] = await Promise.all([
            prisma.printSize.findMany({ where: { isActive: true }, orderBy: { basePrice: 'asc' } }),
            prisma.magnetPrice.findMany({ where: { isActive: true } }),
            prisma.deliveryOption.findMany({ where: { isActive: true } }),
            prisma.volumeDiscount.findMany({ include: { printSize: true } }),
            prisma.giftThreshold.findFirst({ where: { isActive: true }, orderBy: { minAmount: 'asc' } }),
        ]);

        // Natural sort for magnet prices (e.g. 9x13 < 10x15)
        magnetPrices.sort((a: any, b: any) => {
            const parse = (s: string) => {
                const parts = s.split('x').map(Number);
                return parts.length === 2 && !isNaN(parts[0]) ? parts[0] * parts[1] : 0;
            };
            const areaA = parse(a.sizeSlug);
            const areaB = parse(b.sizeSlug);
            if (areaA && areaB && areaA !== areaB) return areaA - areaB;
            return a.sizeSlug.localeCompare(b.sizeSlug, undefined, { numeric: true });
        });

        return NextResponse.json({
            sizes,
            magnetPrices,
            deliveryOptions,
            discounts,
            giftThreshold,
        });
    } catch (error) {
        console.error("Error fetching pricing data:", error);
        return NextResponse.json({ sizes: [], magnetPrices: [], deliveryOptions: [], discounts: [] });
    }
}
