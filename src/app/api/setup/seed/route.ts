import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Simple security check. 
        // In production, change this to something long and random if you plan to keep the file.
        if (secret !== 'fujimir-setup-2024') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = [];
        const supportedLangs = ['uk', 'ru', 'en', 'pl', 'de', 'fr', 'it', 'es', 'ja', 'zh'];

        // 1. Load Keys from JSON sources
        // We'll look for the translation files we know exist
        const messagesDir = path.join(process.cwd(), 'messages');
        // If logic is usually fetching from DB, we need to know where the SOURCE keys are.
        // Assuming we rely on the specific list of critical admin keys we added earlier.

        const criticalKeys = [
            // STORAGE / UPLOADS
            'admin.storage.title',
            'admin.storage.totalfiles',
            'admin.storage.usedspace',
            'admin.storage.cleanup',
            'admin.storage.cleanup_success',
            'admin.storage.confirm_delete',
            'admin.cleanup_orphaned',
            'admin.cleanup_temp',

            // SETTINGS
            'admin.settings.title',
            'admin.settings.general',
            'admin.settings.security',
            'admin.settings.save',
            'admin.settings.saved',

            // STATS
            'admin.stats.orders',
            'admin.stats.revenue',
            'admin.stats.clients',
            'admin.stats.cpu',
            'admin.stats.ram'
        ];

        // Default values for English (acting as fallback/source)
        const defaults: Record<string, string> = {
            'admin.storage.title': 'Storage Management',
            'admin.storage.totalfiles': 'Total Files',
            'admin.storage.usedspace': 'Used Space',
            'admin.storage.cleanup': 'Cleanup',
            'admin.storage.cleanup_success': 'Cleanup completed successfully',
            'admin.storage.confirm_delete': 'Are you sure you want to delete these files?',
            'admin.cleanup_orphaned': 'Delete Orphaned Images',
            'admin.cleanup_temp': 'Clear Temp Folder',

            'admin.settings.title': 'Settings',
            'admin.settings.general': 'General',
            'admin.settings.security': 'Security',
            'admin.settings.save': 'Save Changes',
            'admin.settings.saved': 'Settings saved successfully',

            'admin.stats.orders': 'Total Orders',
            'admin.stats.revenue': 'Revenue',
            'admin.stats.clients': 'Active Clients',
            'admin.stats.cpu': 'CPU Usage',
            'admin.stats.ram': 'RAM Usage'
        };

        // 2. Insert into Database
        for (const lang of supportedLangs) {
            let insertedCount = 0;

            for (const key of criticalKeys) {
                const value = defaults[key] || key;
                // For other languages, we just use the English value as a placeholder
                // or append the lang code so it's visible (e.g. "Storage Management (uk)")
                // Ideally, you'd load real translations here.
                const finalValue = lang === 'en' ? value : `${value} (${lang})`;

                await prisma.translation.upsert({
                    where: {
                        lang_key: {
                            lang: lang,
                            key: key
                        }
                    },
                    update: {}, // Don't overwrite if exists
                    create: {
                        lang: lang,
                        key: key,
                        value: finalValue
                    }
                });
                insertedCount++;
            }
            results.push({ lang, inserted: insertedCount });
        }

        return NextResponse.json({
            success: true,
            message: 'Seeding completed',
            details: results
        });

    } catch (error: any) {
        console.error('Seeding error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
