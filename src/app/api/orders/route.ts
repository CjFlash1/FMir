import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customer, items, total } = body;

        // Generate a random order number
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

        const order = await prisma.order.create({
            data: {
                orderNumber,
                totalAmount: total,
                customerName: customer.name,
                customerPhone: customer.phone,
                customerEmail: customer.email,
                deliveryMethod: customer.deliveryMethod,
                deliveryAddress: customer.deliveryAddress,
                items: {
                    create: items.map((item: any) => ({
                        type: "PRINT",
                        name: `${item.options.size} ${item.options.paper}`,
                        quantity: item.options.quantity,
                        price: item.priceSnapshot,
                        subtotal: item.priceSnapshot * item.options.quantity,
                        size: item.options.size,
                        paper: item.options.paper,
                        options: JSON.stringify(item.options.options || {}),
                        files: JSON.stringify([{
                            original: item.fileName,
                            server: item.serverFileName
                        }]),
                    }))
                }
            },
        });

        return NextResponse.json({ success: true, orderNumber: order.orderNumber });
    } catch (error) {
        console.error("Order creation failed:", error);
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
        );
    }
}
