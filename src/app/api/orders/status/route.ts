import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { email, orderNumber } = await req.json();

        if (!email || !orderNumber) {
            return NextResponse.json({ error: "Email/Order Number required" }, { status: 400 });
        }

        const order = await prisma.order.findFirst({
            where: {
                orderNumber: orderNumber.trim()
            },
            include: {
                items: {
                    select: {
                        id: true,
                        name: true,
                        quantity: true,
                        subtotal: true
                    }
                }
            }
        });

        const isEmailMatch = order?.customerEmail?.trim().toLowerCase() === email.trim().toLowerCase();

        if (!order || !isEmailMatch) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json({
            orderNumber: order.orderNumber,
            status: order.status,
            createdAt: order.createdAt,
            totalAmount: order.totalAmount,
            deliveryMethod: order.deliveryMethod,
            items: order.items
        });

    } catch (e) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
