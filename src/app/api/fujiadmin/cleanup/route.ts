import { NextResponse } from "next/server";
import { readdir, stat, rename, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const uploadsDir = join(process.cwd(), "public", "uploads");

        // Config: Files older than 24 hours
        const MAX_AGE_HOURS = 24;
        const now = Date.now();
        const maxAgeMs = MAX_AGE_HOURS * 60 * 60 * 1000;

        const orphans: string[] = [];
        const errors: string[] = [];

        // 1. Scan for orphans
        let files;
        try {
            files = await readdir(uploadsDir);
        } catch (e) {
            return NextResponse.json({ deletedCount: 0, message: "Uploads directory empty or not found" });
        }

        for (const file of files) {
            if (file.startsWith('.')) continue; // Skip hidden
            const filePath = join(uploadsDir, file);

            try {
                const stats = await stat(filePath);
                if (stats.isDirectory()) continue; // Skip order folders

                const ageMs = now - stats.mtimeMs;
                if (ageMs > maxAgeMs) {
                    // Check DB usage to avoid touching drafts/legacy orders
                    const isUsed = await prisma.orderItem.findFirst({
                        where: { files: { contains: file } },
                        select: { id: true }
                    });

                    if (!isUsed) {
                        orphans.push(file);
                    }
                }
            } catch (err) {
                console.error(`Error checking file ${file}:`, err);
            }
        }

        if (orphans.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No lost files found.",
                recoveredCount: 0
            });
        }

        // 2. Create "Recovery Order" to hold these files
        // Generate Order Number similar to orders API
        let orderNumber: string;
        try {
            const seqs = await prisma.$queryRaw<Array<{ id: number, currentValue: number }>>`SELECT id, currentValue FROM OrderSequence LIMIT 1`;
            if (seqs && seqs.length > 0) {
                const id = seqs[0].id;
                await prisma.$executeRaw`UPDATE OrderSequence SET currentValue = currentValue + 1 WHERE id = ${id}`;
                const updated = await prisma.$queryRaw<Array<{ currentValue: number }>>`SELECT currentValue FROM OrderSequence WHERE id = ${id}`;
                orderNumber = updated[0].currentValue.toString();
            } else {
                await prisma.$executeRaw`INSERT INTO OrderSequence (currentValue) VALUES (10001)`;
                orderNumber = "10001";
            }
        } catch (e) {
            console.error("Sequence error", e);
            orderNumber = `REC-${Date.now()}`; // Fallback if DB seq fails
        }

        // Create Order Folder
        const orderDir = join(uploadsDir, orderNumber);
        await mkdir(orderDir, { recursive: true });

        // 3. Move Files & Prepare Items
        const recoveredItems = [];
        let movedCount = 0;

        for (const fileName of orphans) {
            try {
                const oldPath = join(uploadsDir, fileName);
                const newPath = join(orderDir, fileName);

                await rename(oldPath, newPath);

                // Add to items list
                recoveredItems.push({
                    type: "RECOVERED",
                    name: `Lost File: ${fileName}`,
                    quantity: 1,
                    price: 0,
                    subtotal: 0,
                    options: JSON.stringify({ isRecovered: true }),
                    files: JSON.stringify([{
                        original: fileName,
                        server: `${orderNumber}/${fileName}`
                    }])
                });
                movedCount++;
            } catch (e) {
                console.error(`Failed to move orphan ${fileName}`, e);
                errors.push(fileName);
            }
        }

        // 4. Save Order to DB
        if (movedCount > 0) {
            await prisma.order.create({
                data: {
                    orderNumber,
                    status: "ON_HOLD", // Marked as problematic/hold
                    customerName: "SYSTEM RECOVERY",
                    customerFirstName: "SYSTEM",
                    customerLastName: "RECOVERY",
                    customerPhone: "-",
                    customerEmail: "admin@localhost",
                    deliveryMethod: "PICKUP",
                    totalAmount: 0,
                    notes: `Automatically recovered ${movedCount} lost files. Found by system cleanup.`,
                    items: {
                        create: recoveredItems
                    }
                }
            });
        }

        return NextResponse.json({
            success: true,
            recoveredCount: movedCount,
            orderNumber: orderNumber,
            message: `Recovered ${movedCount} files into Order #${orderNumber}`
        });

    } catch (error: any) {
        console.error("Cleanup error:", error);
        return NextResponse.json(
            { error: "Cleanup failed", message: error.message },
            { status: 500 }
        );
    }
}
