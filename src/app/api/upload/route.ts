import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";
import sharp from "sharp";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Always use .jpg extension for the saved file
        const fileName = `${crypto.randomUUID()}.jpg`;
        const uploadsDir = join(process.cwd(), "public", "uploads");
        const path = join(uploadsDir, fileName);

        // Ensure directory exists
        await mkdir(uploadsDir, { recursive: true });

        // Process with sharp:
        // 1. toFormat('jpeg') - convert to JPG
        // 2. jpeg({ quality: 90 }) - set quality
        // 3. flatten({ background: { r: 255, g: 255, b: 255 } }) - remove transparency (important for PNG)
        // 4. toBuffer() - get the processed bytes
        const processedBuffer = await sharp(buffer)
            .flatten({ background: { r: 255, g: 255, b: 255 } }) // Handle PNG transparency
            .rotate() // Auto-rotate based on EXIF
            .toFormat('jpeg', { quality: 90, progressive: true })
            .toBuffer();

        await writeFile(path, processedBuffer);
        console.log(`File converted and saved to ${path}`);

        return NextResponse.json({
            success: true,
            fileName: fileName,
            originalName: file.name
        });
    } catch (error: any) {
        console.error("Upload/Processing error:", error);
        return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }
}
