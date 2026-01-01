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
        if (secret !== 'fujimir-setup-2024') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = [];
        const supportedLangs = ['uk', 'ru', 'en', 'pl', 'de', 'fr', 'it', 'es', 'ja', 'zh'];

        // Correct keys based on codebase and screenshots
        const criticalKeys = [
            // DIRECTLY OBSERVED IN SCREENSHOT
            'admin.storage',
            'admin.files',
            'admin.cleanup',

            // DASHBOARD (found in page.tsx)
            'admin.dashboard',
            'admin.stats.total_orders',
            'admin.stats.storage_used',

            // ORDER STATUSES
            'admin.stats.pending',
            'admin.stats.processing',
            'admin.stats.completed',
            'admin.stats.draft',

            // SUBTITLES
            'admin.stats.new_orders',
            'admin.stats.in_progress',
            'admin.stats.done',
            'admin.stats.not_submitted',

            // SETTINGS
            'admin.settings',
            'admin.settings.title',
            'admin.settings.general',
            'admin.settings.security',
            'admin.settings.save',
            'admin.settings.saved',
            'admin.settings.site_name',
            'admin.settings.support_email',
            'admin.settings.contact_phone1',
            'admin.settings.contact_phone2',
            'admin.settings.contact_address',
            'admin.settings.contact_schedule',

            // CLEANUP / MAINT
            'admin.cleanup_orphaned',
            'admin.cleanup_temp'
        ];

        // Default values for English
        const defaults: Record<string, string> = {
            'admin.storage': 'Storage',
            'admin.files': 'files',
            'admin.cleanup': 'Cleanup',

            'admin.dashboard': 'Dashboard',
            'admin.stats.total_orders': 'Total Orders',
            'admin.stats.storage_used': 'Storage Used',

            'admin.stats.pending': 'Pending',
            'admin.stats.processing': 'Processing',
            'admin.stats.completed': 'Completed',
            'admin.stats.draft': 'Draft',

            'admin.stats.new_orders': 'New Orders',
            'admin.stats.in_progress': 'In Progress',
            'admin.stats.done': 'Done',
            'admin.stats.not_submitted': 'Not Submitted',

            'admin.settings': 'Settings',
            'admin.settings.title': 'Settings',
            'admin.cleanup_orphaned': 'Delete Orphaned Images',
            'admin.cleanup_temp': 'Clear Temp Folder',
        };

        // 2. Insert into Database
        for (const lang of supportedLangs) {
            let insertedCount = 0;

            for (const key of criticalKeys) {
                const value = defaults[key] || key;
                // English gets clean value, others get identified value
                const finalValue = lang === 'en' ? value : `${value}`;
                // Note: Removed " (lang)" suffix to make it look cleaner immediately, 
                // user can edit later. Or strictly:
                // const finalValue = lang === 'en' ? value : `${value} (${lang})`; 

                // Smart Upsert: Update even if exists? 
                // User wants to FIX missing keys. If key exists but is empty/wrong, we might want to update.
                // But risking overwriting manual changes. 
                // Let's stick to update: {} which means "only create if missing".
                // Actually, if the key exists but the UI shows 'admin.storage', it means it might NOT exist in DB?
                // Or it exists returning null? 
                // Prisma upsert create logic works if UNIQUE constraint failed.

                await prisma.translation.upsert({
                    where: {
                        lang_key: {
                            lang: lang,
                            key: key
                        }
                    },
                    update: {}, // Keep existing if found
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
            message: 'Seeding completed (Updated Keys)',
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
