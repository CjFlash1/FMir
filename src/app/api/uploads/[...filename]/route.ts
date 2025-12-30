import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ filename: string[] }> }
) {
    const { filename } = await context.params;

    // Join path segments
    const filePathRel = filename.join('/');

    // Security check to prevent path traversal
    if (filePathRel.includes('..') || filePathRel.includes('\\')) {
        return new NextResponse("Invalid filename", { status: 400 });
    }

    // Try multiple paths to find the file
    // 1. Standard public/uploads (local dev or symlink)
    // 2. Direct volume path (Railway production override)
    const pathsToTry = [
        path.join(process.cwd(), 'public', 'uploads', ...filename),
        '/app/data/uploads/' + filePathRel
    ];

    for (const filePath of pathsToTry) {
        try {
            const fileBuffer = await fs.readFile(filePath);
            const ext = path.extname(filePathRel).toLowerCase();
            let contentType = 'application/octet-stream';

            if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
            else if (ext === '.png') contentType = 'image/png';
            else if (ext === '.pdf') contentType = 'application/pdf';
            else if (ext === '.zip') contentType = 'application/zip';
            else if (ext === '.rar') contentType = 'application/x-rar-compressed';
            else if (ext === '.7z') contentType = 'application/x-7z-compressed';

            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            });
        } catch (e) {
            // File not found in this path, try next
            continue;
        }
    }

    return new NextResponse("File not found", { status: 404 });
}
