
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const translations = [
        { key: 'settings.maintenance', val: { uk: 'Обслуговування', ru: 'Обслуживание', en: 'Maintenance' } },
        { key: 'settings.maintenance_desc', val: { uk: 'Системні операції та очищення', ru: 'Системные операции и очистка', en: 'System operations and cleanup' } },
        { key: 'settings.cleanup_files', val: { uk: 'Очищення старих файлів', ru: 'Очистка старых файлов', en: 'Cleanup old files' } },
        { key: 'settings.cleanup_files_desc', val: { uk: 'Перевірка та архівація файлів, які не прив\'язані до замовлень', ru: 'Проверка и архивация файлов, не привязанных к заказам', en: 'Check and archive files not linked to orders' } },
        { key: 'settings.run_cleanup', val: { uk: 'Запустити очищення', ru: 'Запустить очистку', en: 'Run Cleanup' } },
        { key: 'settings.cleanup_success', val: { uk: 'Очищення завершено успішно', ru: 'Очистка успешно завершена', en: 'Cleanup completed successfully' } },
        { key: 'settings.cleanup_error', val: { uk: 'Помилка під час очищення', ru: 'Ошибка при очистке', en: 'Error during cleanup' } },
        { key: 'settings.confirm_cleanup', val: { uk: 'Ви впевнені? Це перемістить осиротілі файли в архів.', ru: 'Вы уверены? Это переместит потерянные файлы в архив.', en: 'Are you sure? This will move orphaned files to archive.' } },
    ];

    console.log('Adding Maintenance translations...');

    for (const t of translations) {
        await prisma.translation.upsert({ where: { lang_key: { lang: 'uk', key: t.key } }, update: { value: t.val.uk }, create: { lang: 'uk', key: t.key, value: t.val.uk } });
        await prisma.translation.upsert({ where: { lang_key: { lang: 'ru', key: t.key } }, update: { value: t.val.ru }, create: { lang: 'ru', key: t.key, value: t.val.ru } });
        await prisma.translation.upsert({ where: { lang_key: { lang: 'en', key: t.key } }, update: { value: t.val.en }, create: { lang: 'en', key: t.key, value: t.val.en } });
    }

    console.log('Done.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
