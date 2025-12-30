import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory store (Note: cleared on restart/serverless function recycle)
// This serves as a basic protection layer. For distributed systems, use Redis.
const ipMap = new Map<string, { count: number; lastReset: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute

export function middleware(request: NextRequest) {
    // Determine path
    const path = request.nextUrl.pathname;

    // Only limit API routes
    if (!path.startsWith('/api')) {
        return NextResponse.next();
    }

    // Only limit state-changing methods or expensive operations
    // GET requests are usually cheap (cached) or harmless reading, 
    // but strict bots scraping could be an issue. For now, limit write ops.
    if (request.method !== 'POST' && request.method !== 'DELETE' && request.method !== 'PUT') {
        return NextResponse.next();
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Specific Limits (requests per minute)
    let limit = 60; // default generic POST limit

    // SKIP LIMIT for uploads (User request: Allow mass uploads of thousands of photos without warning)
    if (path.startsWith('/api/upload')) {
        return NextResponse.next();
    } else if (path.startsWith('/api/orders')) {
        limit = 10; // 10 orders per minute (prevent order spam)
    } else if (path.startsWith('/api/auth')) {
        limit = 5; // Brute force protection (future proofing)
    }

    const now = Date.now();
    const record = ipMap.get(ip) || { count: 0, lastReset: now };

    // Reset window
    if (now - record.lastReset > WINDOW_MS) {
        record.count = 0;
        record.lastReset = now;
    }

    record.count++;
    ipMap.set(ip, record);

    if (record.count > limit) {
        return new NextResponse(
            JSON.stringify({ error: "Too many requests. Please try again later." }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
