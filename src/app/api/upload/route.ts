import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { join } from "path";
import crypto from "crypto";
import sharp from "sharp";

// === VALIDATION CONFIG ===
const ALLOWED_MIME_TYPES = [
    // Standard web formats
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    // Other common formats
    'image/bmp',
    'image/x-ms-bmp',
    'image/tiff',
    'image/x-tiff',
    // Apple formats (Sharp supports HEIC/HEIF natively)
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
    // Vector (will be rasterized by Sharp)
    'image/svg+xml',
    // Icons
    'image/x-icon',
    'image/vnd.microsoft.icon',
    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/vnd.rar',
    'application/x-7z-compressed',
];

const ALLOWED_EXTENSIONS = [
    // Standard web
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif',
    // Common
    '.bmp', '.tiff', '.tif',
    // Apple
    '.heic', '.heif',
    // Vector
    '.svg',
    // Icons
    '.ico',
    // Archives
    '.zip', '.rar', '.7z',
];

const ARCHIVE_EXTENSIONS = ['.zip', '.rar', '.7z'];
const ARCHIVE_MIME_TYPES = [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/vnd.rar',
    'application/x-7z-compressed',
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

// Magic bytes signatures for common image formats
const IMAGE_SIGNATURES: { bytes: number[]; offset?: number; mask?: number[] }[] = [
    { bytes: [0xFF, 0xD8, 0xFF] },                          // JPEG
    { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }, // PNG
    { bytes: [0x47, 0x49, 0x46, 0x38] },                    // GIF
    { bytes: [0x42, 0x4D] },                                // BMP
    { bytes: [0x49, 0x49, 0x2A, 0x00] },                    // TIFF (little-endian)
    { bytes: [0x4D, 0x4D, 0x00, 0x2A] },                    // TIFF (big-endian)
    { bytes: [0x00, 0x00, 0x01, 0x00] },                    // ICO
    { bytes: [0x49, 0x49, 0x52, 0x4F] },                    // ORF (Olympus)
];

function isValidImageSignature(buffer: Buffer, mimeType: string, extension: string): boolean {
    // Check basic signatures
    for (const sig of IMAGE_SIGNATURES) {
        const offset = sig.offset || 0;
        if (buffer.length < offset + sig.bytes.length) continue;

        let match = true;
        for (let i = 0; i < sig.bytes.length; i++) {
            if (buffer[offset + i] !== sig.bytes[i]) {
                match = false;
                break;
            }
        }
        if (match) return true;
    }

    // HEIC/HEIF/AVIF (ftyp box)
    if (buffer.length > 12) {
        const ftypCheck = buffer.toString('ascii', 4, 8);
        if (ftypCheck === 'ftyp') {
            const brand = buffer.toString('ascii', 8, 12).toLowerCase();
            if (['heic', 'heix', 'hevc', 'mif1', 'avif', 'avis', 'msf1'].includes(brand)) {
                return true;
            }
        }
    }

    // WebP (RIFF....WEBP)
    if (buffer.length > 12) {
        const riff = buffer.toString('ascii', 0, 4);
        const webp = buffer.toString('ascii', 8, 12);
        if (riff === 'RIFF' && webp === 'WEBP') {
            return true;
        }
    }

    // SVG (text-based, check for XML/SVG markers)
    if (extension === '.svg' || mimeType === 'image/svg+xml') {
        const start = buffer.toString('utf8', 0, Math.min(1000, buffer.length));
        if (start.includes('<svg') || start.includes('<?xml')) {
            return true;
        }
    }

    return false;
}

function isJpegFile(buffer: Buffer): boolean {
    // Check JPEG magic bytes: FF D8 FF
    return buffer.length >= 3 &&
        buffer[0] === 0xFF &&
        buffer[1] === 0xD8 &&
        buffer[2] === 0xFF;
}

// Helper for transliteration and sanitization
function sanitizeFilename(name: string): string {
    const translitMap: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
        'я': 'ya', 'і': 'i', 'ї': 'yi', 'є': 'ye', 'ґ': 'g',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'G', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
        'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
        'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts',
        'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
        'Я': 'Ya', 'І': 'I', 'Ї': 'Yi', 'Є': 'Ye', 'Ґ': 'G'
    };

    let result = name.split('').map(char => translitMap[char] || char).join('');
    result = result.replace(/\s+/g, '_');
    result = result.replace(/[^a-zA-Z0-9._-]/g, '');
    return result;
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const mimeType = file.type.toLowerCase();
        const extension = '.' + (file.name.split('.').pop()?.toLowerCase() || '');

        // Determine if it is an archive
        const isArchive = ARCHIVE_EXTENSIONS.includes(extension) || ARCHIVE_MIME_TYPES.includes(mimeType);

        // === VALIDATION 1: File size ===
        // Archives: No strict limit (or use huge limit). Images: 100MB
        if (!isArchive && file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
            }, { status: 400 });
        }

        // === VALIDATION 2: MIME type ===
        if (!ALLOWED_MIME_TYPES.includes(mimeType) && !isArchive) {
            return NextResponse.json({
                error: `Invalid file type: ${file.type}.`
            }, { status: 400 });
        }

        // === VALIDATION 3: File extension ===
        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            return NextResponse.json({
                error: `Invalid file extension: ${extension}.`
            }, { status: 400 });
        }

        const uploadsDir = join(process.cwd(), "public", "uploads");
        await mkdir(uploadsDir, { recursive: true });

        // === HANDLING ARCHIVES (STREAMING to avoid RAM usage) ===
        if (isArchive) {
            const fileName = `${crypto.randomUUID()}${extension}`;
            const path = join(uploadsDir, fileName);

            // Create write stream
            const writeStream = createWriteStream(path);

            // Convert WebStream (file.stream()) to Node Readable for pipeline
            // @ts-ignore - Readable.fromWeb requires Node 18+ types which might not be picked up correctly in some envs
            const readable = Readable.fromWeb(file.stream());

            await pipeline(readable, writeStream);

            return NextResponse.json({
                success: true,
                fileName: fileName,
                originalName: sanitizeFilename(file.name),
                wasConverted: false
            });
        }

        // === HANDLING IMAGES (BUFFERING for processing) ===
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // === VALIDATION 4: Magic bytes (file signature) ===
        if (!isValidImageSignature(buffer, mimeType, extension)) {
            return NextResponse.json({
                error: "File content does not match a valid image format. File may be corrupted or fake."
            }, { status: 400 });
        }

        // Generate filename
        let fileName: string;
        let finalBuffer: Buffer;

        // Image Logic
        fileName = `${crypto.randomUUID()}.jpg`; // Force .jpg for images

        // === CHECK IF ORIGINAL JPEG ===
        if (isJpegFile(buffer)) {
            // JPG files: save original without any processing
            finalBuffer = buffer;
        } else {
            // Non-JPG files: convert to JPEG with 100% quality
            try {
                finalBuffer = await sharp(buffer)
                    .flatten({ background: { r: 255, g: 255, b: 255 } }) // Handle transparency
                    .rotate() // Auto-rotate based on EXIF
                    .toColorspace('srgb') // Ensure standard RGB color space
                    .toFormat('jpeg', { quality: 100, progressive: true })
                    .toBuffer();
            } catch (e) {
                console.error("Sharp conversion failed:", e);
                return NextResponse.json({ error: "Failed to process image file." }, { status: 500 });
            }
        }

        const path = join(uploadsDir, fileName);

        // Write file
        await writeFile(path, finalBuffer);

        return NextResponse.json({
            success: true,
            fileName: fileName,
            originalName: sanitizeFilename(file.name),
            wasConverted: !isJpegFile(buffer)
        });
    } catch (error: any) {
        console.error("Upload/Processing error:", error);

        // Check if it's a sharp processing error
        if (error.message?.includes('Input buffer') || error.message?.includes('unsupported image format')) {
            return NextResponse.json({
                error: "Could not process image. The file may be corrupted or in an unsupported format. RAW camera files require additional system libraries."
            }, { status: 400 });
        }

        return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const fileName = searchParams.get("fileName");

        if (!fileName) {
            return NextResponse.json({ error: "Filename required" }, { status: 400 });
        }

        // Basic security check to prevent directory traversal
        if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
            return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
        }

        const uploadsDir = join(process.cwd(), "public", "uploads");
        const path = join(uploadsDir, fileName);

        // Delete file using fs/promises unlink
        const { unlink } = require('fs/promises');
        await unlink(path);

        console.log(`Deleted file: ${path}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete error:", error);
        // If file doesn't exist, technically it's a success? Or 404? 
        // Let's return success to not break frontend flow if file was already gone.
        if (error.code === 'ENOENT') {
            return NextResponse.json({ success: true, message: "File already deleted" });
        }
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
