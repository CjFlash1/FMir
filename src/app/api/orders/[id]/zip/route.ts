import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const orderId = parseInt(params.id);
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const zip = new JSZip();
        const orderFolder = zip.folder(`Order_${order.orderNumber}`);

        // Logic for folder organization
        for (const item of order.items) {
            const options = JSON.parse(item.options || "{}");

            // Calculate Folder Name: Size_Paper_Option1_Option2
            let folderName = `${item.size}_${item.paper}`;
            const activeOptions = Object.entries(options)
                .filter(([_, val]) => val)
                .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));

            if (activeOptions.length > 0) {
                folderName += `_${activeOptions.join("_")}`;
            }

            const itemFolder = orderFolder?.folder(folderName);
            const fileMetaList = JSON.parse(item.files || "[]");

            for (const fileMeta of fileMetaList) {
                const serverName = typeof fileMeta === 'string' ? fileMeta : fileMeta.server;
                const originalName = typeof fileMeta === 'string' ? fileMeta : fileMeta.original;

                if (!serverName) continue;

                try {
                    const filePath = join(process.cwd(), "public", "uploads", serverName);
                    const fileData = await readFile(filePath);
                    itemFolder?.file(originalName || "photo.jpg", fileData);
                } catch (e) {
                    console.error(`File missing: ${serverName}`);
                    itemFolder?.file(`${originalName}_MISSING.txt`, "Original file was not found on the server.");
                }
            }
        }

        const content = await zip.generateAsync({ type: "nodebuffer" });

        return new Response(content as any, {
            status: 200,
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename=Order_${order.orderNumber}.zip`,
            },
        });
    } catch (error) {
        console.error("ZIP Generation failed:", error);
        return NextResponse.json({ error: "Failed to generate ZIP" }, { status: 500 });
    }
}
