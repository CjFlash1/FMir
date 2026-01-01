
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MISSING_TRANSLATIONS = [
    {
        key: "admin.storage",
        uk: "Сховище",
        ru: "Хранилище",
        en: "Storage"
    },
    {
        key: "admin.cleanup",
        uk: "Очистити",
        ru: "Очистить",
        en: "Cleanup"
    },
    {
        key: "admin.files",
        uk: "файлів",
        ru: "файлов",
        en: "files"
    },
    {
        key: "admin.stats.storage_used",
        uk: "Використано місця",
        ru: "Использовано места",
        en: "Storage Used"
    }
];

async function main() {
    console.log("Seeding missing translations...");

    for (const item of MISSING_TRANSLATIONS) {
        // UK
        await prisma.translation.upsert({
            where: {
                lang_key: { lang: "uk", key: item.key }
            },
            update: {}, // Don't overwrite if exists
            create: {
                lang: "uk",
                key: item.key,
                value: item.uk
            }
        });

        // RU
        await prisma.translation.upsert({
            where: {
                lang_key: { lang: "ru", key: item.key }
            },
            update: {},
            create: {
                lang: "ru",
                key: item.key,
                value: item.ru
            }
        });

        // EN
        await prisma.translation.upsert({
            where: {
                lang_key: { lang: "en", key: item.key }
            },
            update: {},
            create: {
                lang: "en",
                key: item.key,
                value: item.en
            }
        });

        console.log(`Processed key: ${item.key}`);
    }

    console.log("Done!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
