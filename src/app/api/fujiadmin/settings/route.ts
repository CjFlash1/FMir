import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const settings = await prisma.setting.findMany();
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { key, value, description } = body;

        if (!key) {
            return NextResponse.json({ error: "Key is required" }, { status: 400 });
        }

        const setting = await prisma.setting.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description },
        });

        return NextResponse.json(setting);
    } catch (error) {
        return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
    }
}
