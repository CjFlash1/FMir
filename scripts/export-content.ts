
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Exporting CMS content to JSON...');
    const dataDir = path.join(process.cwd(), 'prisma', 'data');
    await fs.mkdir(dataDir, { recursive: true });

    // 1. Export Settings
    const settings = await prisma.setting.findMany({
        orderBy: { key: 'asc' }
    });
    await fs.writeFile(
        path.join(dataDir, 'settings.json'),
        JSON.stringify(settings, null, 2)
    );
    console.log(`✅ Exported ${settings.length} settings.`);

    // 2. Export Translations
    // We group them nicely for readability if possible, or just raw dump
    const translations = await prisma.translation.findMany({
        orderBy: [{ key: 'asc' }, { lang: 'asc' }]
    });
    await fs.writeFile(
        path.join(dataDir, 'translations.json'),
        JSON.stringify(translations, null, 2)
    );
    console.log(`✅ Exported ${translations.length} translations.`);

    // 3. Export CMS Pages
    const pages = await prisma.page.findMany({
        orderBy: { slug: 'asc' }
    });
    await fs.writeFile(
        path.join(dataDir, 'pages.json'),
        JSON.stringify(pages, null, 2)
    );
    console.log(`✅ Exported ${pages.length} pages.`);

    console.log('Done! Files saved to /prisma/data/');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
