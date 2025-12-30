import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { copyFile, rename, mkdir } from "fs/promises";
import { join, basename } from "path";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customer, items, total, notes, giftChoice } = body;

        // Generate sequential order number via OrderSequence table (RAW SQL)
        let orderNumber: string;
        try {
            // Check current sequence
            const seqs = await prisma.$queryRaw<Array<{ id: number, currentValue: number }>>`SELECT id, currentValue FROM OrderSequence LIMIT 1`;

            if (seqs && seqs.length > 0) {
                const id = seqs[0].id;
                // Update (Increment)
                await prisma.$executeRaw`UPDATE OrderSequence SET currentValue = currentValue + 1 WHERE id = ${id}`;
                // Fetch Updated Value
                const updated = await prisma.$queryRaw<Array<{ currentValue: number }>>`SELECT currentValue FROM OrderSequence WHERE id = ${id}`;
                orderNumber = updated[0].currentValue.toString();
            } else {
                // Insert Intial (10001) if table empty
                await prisma.$executeRaw`INSERT INTO OrderSequence (currentValue) VALUES (10001)`;
                orderNumber = "10001";
            }
        } catch (e) {
            console.error("Order sequence error (raw)", e);
            orderNumber = Date.now().toString();
        }

        // Sort items so gift magnet comes first
        const sortedItems = [...items].sort((a: any, b: any) => {
            if (a.isGiftMagnet && !b.isGiftMagnet) return -1;
            if (!a.isGiftMagnet && b.isGiftMagnet) return 1;
            return 0;
        });

        // === MOVE/COPY FILES TO ORDER FOLDER ===
        const uploadsDir = join(process.cwd(), "public", "uploads");
        const orderDir = join(uploadsDir, orderNumber);

        try {
            await mkdir(orderDir, { recursive: true });

            for (const item of sortedItems) {
                if (item.serverFileName) {
                    const originalPath = join(uploadsDir, item.serverFileName);
                    const fileNameOnly = basename(item.serverFileName);
                    const newPath = join(orderDir, fileNameOnly);

                    // Skip if paths are identical (though unlikely unless re-processing)
                    if (originalPath === newPath) continue;

                    try {
                        const isSubDir = item.serverFileName.includes('/') || item.serverFileName.includes('\\');

                        if (isSubDir) {
                            // Already in a subfolder (e.g. from previous order), COPY it to new order folder
                            // Check if source exists before copying
                            await copyFile(originalPath, newPath);
                        } else {
                            // Flat file (new upload), MOVE it
                            await rename(originalPath, newPath);
                        }

                        // Update the item's server path to be relative to uploads dir (e.g. "1001/file.jpg")
                        item.serverFileName = `${orderNumber}/${fileNameOnly}`;
                    } catch (fileErr) {
                        console.error(`Failed to move/copy file ${item.serverFileName}:`, fileErr);
                        // Continue processing other items/order even if file move fails (don't block order)
                    }
                }
            }
        } catch (err) {
            console.error("Failed to setup order directory:", err);
        }

        // PREPARE ITEM DATA GENERATOR
        const createItemData = (item: any) => ({
            type: "PRINT",
            name: item.isGiftMagnet
                ? `🎁 FREE MAGNET: ${item.options.size}`
                : `${item.options.size} ${item.options.paper}`,
            quantity: item.options.quantity,
            price: item.priceSnapshot,
            subtotal: item.priceSnapshot * item.options.quantity,
            size: item.options.size,
            paper: item.options.paper,
            options: JSON.stringify({
                ...item.options.options,
                cropping: item.options.cropping || 'fill',
                isGiftMagnet: item.isGiftMagnet || false,
            }),
            files: JSON.stringify([{
                original: item.fileName,
                server: item.serverFileName
            }]),
        });

        let order;
        const { draftOrderId } = body;

        if (draftOrderId) {
            // Try to find and upgrade existing draft
            const existingDraft = await prisma.order.findUnique({
                where: { orderNumber: draftOrderId }
            });

            if (existingDraft) {
                // 1. Clear old draft items
                await prisma.orderItem.deleteMany({
                    where: { orderId: existingDraft.id }
                });

                // 2. Update Order to Official Status
                order = await prisma.order.update({
                    where: { id: existingDraft.id },
                    data: {
                        orderNumber: orderNumber, // Assign official number
                        status: "PENDING",
                        totalAmount: total,
                        customerName: `${customer.lastName} ${customer.firstName}`.trim(),
                        customerFirstName: customer.firstName,
                        customerLastName: customer.lastName,
                        customerPhone: customer.phone,
                        customerEmail: customer.email,
                        deliveryMethod: customer.deliveryMethod,
                        deliveryAddress: customer.deliveryAddress,
                        recipientCityRef: body.recipientCityRef || null,
                        recipientWarehouseRef: body.recipientWarehouseRef || null,
                        notes: notes || null,
                        items: {
                            create: sortedItems.map(createItemData)
                        }
                    }
                });
            }
        }

        // Fallback: Create NEW if no draft or draft not found
        if (!order) {
            order = await prisma.order.create({
                data: {
                    orderNumber,
                    totalAmount: total,
                    customerName: `${customer.lastName} ${customer.firstName}`.trim(),
                    customerFirstName: customer.firstName,
                    customerLastName: customer.lastName,
                    customerPhone: customer.phone,
                    customerEmail: customer.email,
                    deliveryMethod: customer.deliveryMethod,
                    deliveryAddress: customer.deliveryAddress,
                    recipientCityRef: body.recipientCityRef || null,
                    recipientWarehouseRef: body.recipientWarehouseRef || null,
                    notes: notes || null,
                    items: {
                        create: sortedItems.map(createItemData)
                    }
                },
            });
        }

        return NextResponse.json({ success: true, orderNumber: order.orderNumber });
    } catch (error: any) {
        console.error("Order creation failed ERROR DETAILS:", {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        return NextResponse.json(
            { error: "Failed to create order", message: error.message },
            { status: 500 }
        );
    }
}
