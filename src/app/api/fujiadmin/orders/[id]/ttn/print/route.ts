import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "document"; // 'document' or 'marking'

        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) }
        });

        if (!order || !order.ttnRef) {
            return NextResponse.json({ error: "TTN Ref not found" }, { status: 404 });
        }

        let apiKey = "";
        try {
            const setting = await prisma.setting.findUnique({ where: { key: "novaposhta_api_key" } });
            if (setting?.value) apiKey = setting.value;
        } catch (e) { /* ignore DB error */ }

        if (!apiKey) {
            return NextResponse.json({ error: "Nova Poshta API Key not configured" }, { status: 500 });
        }

        const baseUrl = "https://my.novaposhta.ua/orders";

        // Format: /orders/printDocument/orders[]/INT_DOC_NUMBER/type/pdf/apiKey/KEY
        // Important: this endpoint typically expects the IntDocNumber (ttnNumber), NOT the Ref (UUID)
        if (!order.ttnNumber) {
            return NextResponse.json({ error: "TTN Number not found" }, { status: 404 });
        }

        let method = type === "marking" ? "printMarking100x100" : "printDocument";

        // Back to path-based style which is the most documented "unofficial" way.
        // We use literal [] because some NP endpoints are picky about encoding
        // and we use ttnNumber (IntDocNumber)

        // Format: https://my.novaposhta.ua/orders/printDocument/orders[]/204500.../type/pdf/apiKey/KEY
        const printUrl = `${baseUrl}/${method}/orders[]/${order.ttnNumber}/type/pdf/apiKey/${apiKey}`;

        // Force copies count if needed (optional but standard)
        // printUrl += "/copies/1";

        // Proxy the request server-side
        const response = await fetch(printUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        if (!response.ok) {
            console.error("NP Print Proxy failed:", response.status, response.statusText);
            return NextResponse.json({ error: "Failed to fetch PDF from Nova Poshta" }, { status: response.status });
        }

        // Check content type
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
            const htmlText = await response.text();
            console.error("NP Print Proxy returned HTML. Preview:", htmlText.substring(0, 500));
            return NextResponse.json({
                error: "Nova Poshta Authorization Error",
                details: "The API Key was rejected for printing. It might lack permissions or the IP is restricted.",
                debugUrl: printUrl.replace(apiKey, 'HIDDEN')
            }, { status: 401 });
        }

        const pdfBuffer = await response.arrayBuffer();

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="ttn-${order.ttnNumber || "doc"}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Print URL generation failed:", error);
        return NextResponse.json({ error: "Failed to generate print URL" }, { status: 500 });
    }
}
