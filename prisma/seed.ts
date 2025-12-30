import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const loadJSON = (filename: string) => {
    try {
        const filePath = path.join(__dirname, 'data', filename);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch (e) { console.error("Error loading " + filename, e); }
    return [];
}

async function main() {
    console.log('Start seeding ...')

    // 1. Paper Types
    await prisma.paperType.upsert({ where: { slug: 'glossy' }, update: {}, create: { name: 'Glossy', slug: 'glossy' } })
    await prisma.paperType.upsert({ where: { slug: 'matte' }, update: {}, create: { name: 'Matte', slug: 'matte' } })

    // 2. Print Options
    await prisma.printOption.upsert({ where: { slug: 'border' }, update: {}, create: { name: 'Border', slug: 'border', price: 0, priceType: 'FIXED' } })
    await prisma.printOption.upsert({ where: { slug: 'magnetic' }, update: {}, create: { name: 'Magnetic', slug: 'magnetic', price: 15, priceType: 'FIXED' } })

    // 3. Print Sizes (from original site)
    const sizes = [
        { name: '9x13', basePrice: 10.00, sortOrder: 0 },
        { name: '10x15', basePrice: 12.00, sortOrder: 1 },
        { name: '13x18', basePrice: 20.00, sortOrder: 2 },
        { name: '15x20', basePrice: 24.00, sortOrder: 3 },
        { name: '20x30', basePrice: 48.00, sortOrder: 4 },
    ]

    for (const s of sizes) {
        await prisma.printSize.upsert({
            where: { slug: s.name },
            update: { basePrice: s.basePrice, sortOrder: s.sortOrder },
            create: { name: s.name, slug: s.name, basePrice: s.basePrice, sortOrder: s.sortOrder }
        })
    }

    // 4. Quantity Tiers (columns in pricing table)
    const tiers = [
        { label: 'Менее 100 шт.', minQuantity: 1, sortOrder: 0 },
        { label: 'Более 100 шт.', minQuantity: 100, sortOrder: 1 },
        { label: 'Более 200 шт.', minQuantity: 200, sortOrder: 2 },
    ]

    for (const t of tiers) {
        const existing = await prisma.quantityTier.findFirst({ where: { minQuantity: t.minQuantity } })
        if (!existing) {
            await prisma.quantityTier.create({ data: t })
        }
    }

    // 5. Volume Discounts (prices from original site)
    // Format: sizeSlug -> { minQuantity: price }
    const discountData: Record<string, Record<number, number>> = {
        '9x13': { 1: 10.00, 100: 9.00, 200: 8.00 },
        '10x15': { 1: 12.00, 100: 10.80, 200: 9.60 },
        '13x18': { 1: 20.00, 100: 18.00, 200: 16.00 },
        '15x20': { 1: 24.00, 100: 21.60, 200: 19.20 },
        '20x30': { 1: 48.00, 100: 43.20, 200: 38.40 },
    }

    for (const [sizeSlug, prices] of Object.entries(discountData)) {
        const size = await prisma.printSize.findUnique({ where: { slug: sizeSlug } })
        if (!size) continue

        for (const [minQtyStr, price] of Object.entries(prices)) {
            const minQuantity = parseInt(minQtyStr)
            const tier = await prisma.quantityTier.findFirst({ where: { minQuantity } })

            const existing = await prisma.volumeDiscount.findFirst({
                where: { printSizeId: size.id, minQuantity }
            })

            if (!existing) {
                await prisma.volumeDiscount.create({
                    data: {
                        printSizeId: size.id,
                        tierId: tier?.id,
                        minQuantity,
                        price
                    }
                })
            } else {
                await prisma.volumeDiscount.update({
                    where: { id: existing.id },
                    data: { price, tierId: tier?.id }
                })
            }
        }
    }

        // 6. Translations (FROM FILE)
    console.log('Seeding Translations from JSON...');
    const translations = loadJSON('translations.json');
    if (translations && translations.length > 0) {
        for (const t of translations) {
             await prisma.translation.upsert({
                where: { lang_key: { lang: t.lang, key: t.key } },
                update: { value: t.value },
                create: { lang: t.lang, key: t.key, value: t.value }
            });
        }
    }

// 5. Sample Volume Discounts
    const size10x15 = await prisma.printSize.findUnique({ where: { slug: '10x15' } });
    if (size10x15) {
        await prisma.volumeDiscount.upsert({
            where: { id: 1 },
            update: { price: 3.80 },
            create: { id: 1, printSizeId: size10x15.id, minQuantity: 51, price: 3.80 }
        });
        await prisma.volumeDiscount.upsert({
            where: { id: 2 },
            update: { price: 3.50 },
            create: { id: 2, printSizeId: size10x15.id, minQuantity: 101, price: 3.50 }
        });
    }

    // 6. Magnet Prices (separate price grid)
    const magnetPrices = [
        { sizeSlug: '10x15', price: 35.00 },
        { sizeSlug: '13x18', price: 60.00 },
        { sizeSlug: '15x20', price: 70.00 },
        { sizeSlug: '20x30', price: 130.00 },
    ];
    for (const mp of magnetPrices) {
        await prisma.magnetPrice.upsert({
            where: { id: magnetPrices.indexOf(mp) + 1 },
            update: { price: mp.price, sizeSlug: mp.sizeSlug },
            create: { sizeSlug: mp.sizeSlug, price: mp.price, isActive: true }
        });
    }

    // 7. Delivery Options
    await prisma.deliveryOption.upsert({
        where: { slug: 'local' },
        update: { price: 150.00 },
        create: { slug: 'local', name: 'Доставка по м. Дніпро', price: 150.00, description: 'Доставка кур\'єром по місту Дніпро', isActive: true }
    });
    await prisma.deliveryOption.upsert({
        where: { slug: 'novaposhta' },
        update: { price: 0 },
        create: { slug: 'novaposhta', name: 'Нова Пошта', price: 0, description: 'Доставка в інші міста України за тарифами Нової Пошти', isActive: true }
    });
    await prisma.deliveryOption.upsert({
        where: { slug: 'pickup' },
        update: { price: 0 },
        create: { slug: 'pickup', name: 'Самовивіз', price: 0, description: 'вул. Європейська, 8', isActive: true }
    });

    // 7.1 Gift Thresholds
    console.log('Seeding Gift Thresholds...');
    await prisma.giftThreshold.upsert({
        where: { id: 1 },
        update: {},
        create: {
            minAmount: 1200,
            giftName: 'Подарок при замовленні від 1200 грн',
            isActive: true
        }
    });

        // 8. Pages (FROM FILE)
    console.log('Seeding Pages from JSON...');
    const pages = loadJSON('pages.json');
    if (pages && pages.length > 0) {
        for (const p of pages) {
             await prisma.page.upsert({
                where: { slug_lang: { slug: p.slug, lang: p.lang } },
                update: { title: p.title, description: p.description, content: p.content },
                create: { slug: p.slug, lang: p.lang, title: p.title, description: p.description, content: p.content }
            });
        }
    }


// 7. Help Center Data
    console.log('Seeding Help Center...');

    // CLEANUP: Remove identifying help categories/articles to ensure fresh seed without conflicts
    // We find the category by slug and delete it (cascade should delete articles)
    const existingCat = await prisma.helpCategory.findFirst({ where: { slug: 'general' } });
    if (existingCat) {
        await prisma.helpCategory.delete({ where: { id: existingCat.id } });
    }

    // Category 1: General (Общие вопросы)
    const catGeneral = await prisma.helpCategory.create({
        data: {
            slug: 'general',
            sortOrder: 10,
            translations: {
                create: [
                    { lang: 'ru', name: 'Общие вопросы' },
                    { lang: 'uk', name: 'Загальні питання' },
                    { lang: 'en', name: 'General Questions' }
                ]
            }
        }
    });

    // Article: Order Procedure
    // We can't easily upsert HelpArticle without a unique key other than ID, but we added 'slug' recently.
    // However, the first article 'How to order' didn't have a slug in the previous code?
    // Checking... yes, it didn't. I'll add a slug 'how-to-order' to it so I can upsert it.

    // -- RU Content for Order Procedure
    const orderContentRU = `
        <div class="space-y-8">
            <h3 class="text-xl font-bold mb-6 text-center">Всего 3 шага к вашим фотографиям</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Step 1 -->
                <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                    <img src="/images/help/step_upload.png" alt="Загрузка" class="w-full max-w-[180px] h-auto mb-4 border-b border-gray-100 pb-2 bg-blend-multiply" />
                    <div class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm">1</div>
                    <h4 class="font-bold text-lg mb-2">Загрузите фото</h4>
                    <p class="text-sm text-gray-600">Загрузите файлы на наш сайт с компьютера или телефона в пару кликов.</p>
                </div>
                
                <!-- Step 2 -->
                <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                    <img src="/images/help/step_sizes.png" alt="Выбор формата" class="w-full max-w-[180px] h-auto mb-4 border-b border-gray-100 pb-2 bg-blend-multiply" />
                    <div class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm">2</div>
                    <h4 class="font-bold text-lg mb-2">Настройте печать</h4>
                    <p class="text-sm text-gray-600">Выберите нужный формат (9x13, 10x15, 15x20...), тип бумаги и рамку.</p>
                </div>

                <!-- Step 3 -->
                <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                    <img src="/images/help/step_delivery.png" alt="Доставка" class="w-full max-w-[180px] h-auto mb-4 border-b border-gray-100 pb-2 bg-blend-multiply" />
                    <div class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm">3</div>
                    <h4 class="font-bold text-lg mb-2">Получите заказ</h4>
                    <p class="text-sm text-gray-600">Быстрая доставка почтой или самовывоз из нашей фотолаборатории.</p>
                </div>
            </div>

            <div class="mt-8 p-6 bg-green-50 rounded-xl border border-green-100 text-center">
                <p class="text-green-800 font-medium mb-4">Готовы приступить?</p>
                <a href="/upload" class="inline-block bg-[#009846] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#007a38] transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    Начать загрузку
                </a>
            </div>
        </div>
    `;

    // -- UK Content for Order Procedure
    const orderContentUK = `
        <div class="space-y-8">
            <h3 class="text-xl font-bold mb-6 text-center">Всього 3 кроки до ваших фотографій</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Step 1 -->
                <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                    <img src="/images/help/step_upload.png" alt="Завантаження" class="w-full max-w-[180px] h-auto mb-4 border-b border-gray-100 pb-2 bg-blend-multiply" />
                    <div class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm">1</div>
                    <h4 class="font-bold text-lg mb-2">Завантажте фото</h4>
                    <p class="text-sm text-gray-600">Завантажте файли на наш сайт з комп'ютера або телефону в пару кліків.</p>
                </div>
                
                <!-- Step 2 -->
                <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                    <img src="/images/help/step_sizes.png" alt="Вибір формату" class="w-full max-w-[180px] h-auto mb-4 border-b border-gray-100 pb-2 bg-blend-multiply" />
                    <div class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm">2</div>
                    <h4 class="font-bold text-lg mb-2">Налаштуйте друк</h4>
                    <p class="text-sm text-gray-600">Оберіть потрібний формат (9x13, 10x15, 15x20...), тип паперу та рамку.</p>
                </div>

                <!-- Step 3 -->
                <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                    <img src="/images/help/step_delivery.png" alt="Доставка" class="w-full max-w-[180px] h-auto mb-4 border-b border-gray-100 pb-2 bg-blend-multiply" />
                    <div class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm">3</div>
                    <h4 class="font-bold text-lg mb-2">Отримайте замовлення</h4>
                    <p class="text-sm text-gray-600">Швидка доставка поштою або самовивіз з нашої фотолабораторії.</p>
                </div>
            </div>

             <div class="mt-8 p-6 bg-green-50 rounded-xl border border-green-100 text-center">
                <p class="text-green-800 font-medium mb-4">Готові розпочати?</p>
                <a href="/upload" class="inline-block bg-[#009846] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#007a38] transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    Почати завантаження
                </a>
            </div>
        </div>
    `;

    // -- EN Content for Order Procedure
    const orderContentEN = `
        <div class="space-y-8">
            <h3 class="text-xl font-bold mb-6 text-center">Just 3 steps to your photos</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Step 1 -->
                <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                    <img src="/images/help/step_upload.png" alt="Upload" class="w-full max-w-[180px] h-auto mb-4 border-b border-gray-100 pb-2 bg-blend-multiply" />
                    <div class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm">1</div>
                    <h4 class="font-bold text-lg mb-2">Upload Photos</h4>
                    <p class="text-sm text-gray-600">Upload files to our website from your computer or phone in a few clicks.</p>
                </div>
                
                <!-- Step 2 -->
                <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                    <img src="/images/help/step_sizes.png" alt="Select Size" class="w-full max-w-[180px] h-auto mb-4 border-b border-gray-100 pb-2 bg-blend-multiply" />
                    <div class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm">2</div>
                    <h4 class="font-bold text-lg mb-2">Configure Print</h4>
                    <p class="text-sm text-gray-600">Choose format (9x13, 10x15, 15x20...), paper type, and boarders.</p>
                </div>

                <!-- Step 3 -->
                <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                    <img src="/images/help/step_delivery.png" alt="Delivery" class="w-full max-w-[180px] h-auto mb-4 border-b border-gray-100 pb-2 bg-blend-multiply" />
                    <div class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 shadow-sm">3</div>
                    <h4 class="font-bold text-lg mb-2">Receive Order</h4>
                    <p class="text-sm text-gray-600">Fast delivery by mail or pickup from our photolab.</p>
                </div>
            </div>

            <div class="mt-8 p-6 bg-green-50 rounded-xl border border-green-100 text-center">
                <p class="text-green-800 font-medium mb-4">Ready to start?</p>
                <a href="/upload" class="inline-block bg-[#009846] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#007a38] transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    Start Uploading
                </a>
            </div>
        </div>
    `;

    await prisma.helpArticle.upsert({
        where: { slug: 'how-to-order' },
        update: {},
        create: {
            slug: 'how-to-order',
            helpCategoryId: catGeneral.id,
            sortOrder: 1,
            translations: {
                create: [
                    { lang: 'ru', title: 'Как сделать заказ?', content: orderContentRU },
                    { lang: 'uk', title: 'Як зробити замовлення?', content: orderContentUK },
                    { lang: 'en', title: 'How to order?', content: orderContentEN }
                ]
            }
        }
    });

    // 1. Photo Sizes (Размеры фотографий) - Main Page

    const sizesContentRU = `
<h3 class="text-lg font-bold mb-4">Размеры фотографий</h3>
<table class="w-full border-collapse border border-gray-300 mb-6 text-sm">
    <thead class="bg-gray-100">
        <tr>
            <th class="border border-gray-300 p-2 text-left">Формат</th>
            <th class="border border-gray-300 p-2 text-left">Точный размер</th>
        </tr>
    </thead>
    <tbody>
        <tr><td class="border border-gray-300 p-2 text-center bg-yellow-50/50">9x13</td><td class="border border-gray-300 p-2 bg-yellow-50/50">89x127mm</td></tr>
        <tr><td class="border border-gray-300 p-2 text-center">13x18</td><td class="border border-gray-300 p-2">127x178mm</td></tr>
        <tr><td class="border border-gray-300 p-2 text-center bg-yellow-50/50">10x15</td><td class="border border-gray-300 p-2 bg-yellow-50/50">100x152mm</td></tr>
        <tr>
            <td class="border border-gray-300 p-2 text-center align-middle" rowspan="3">15x20</td>
            <td class="border border-gray-300 p-2">152x203mm</td>
        </tr>
        <tr><td class="border border-gray-300 p-2">152x210mm</td></tr>
        <tr><td class="border border-gray-300 p-2">152x216mm</td></tr>
        <tr><td class="border border-gray-300 p-2 text-center bg-yellow-50/50">20x30</td><td class="border border-gray-300 p-2 bg-yellow-50/50">203x305mm</td></tr>
    </tbody>
</table>
<div class="space-y-4 text-sm text-gray-800">
    <p><strong>Тип фотографий JPEG (расширение jpg, jpeg), цветовая модель RGB.</strong></p>
    <p>Для получения точных геометрических размеров фотоснимка помимо точных размеров нужно указать разрешение снимка 300dpi (точек на дюйм). Во всех остальных случаях это необязательно, но разрешение не должно превышать отметку в 300dpi.</p>
    <div class="p-4 bg-red-50 border border-red-100 rounded-lg text-red-900">
        <p><strong>Важно:</strong> Старайтесь не размещать важных элементов и надписей близко ("в притык") к краю фотографии, т.к. в результате постепенного износа, и последующей калибровки форматов, размер края снимка может варьироваться в пределах 2мм.</p>
    </div>
</div>`;

    const sizesContentUK = `
<h3 class="text-lg font-bold mb-4">Розміри фотографій</h3>
<table class="w-full border-collapse border border-gray-300 mb-6 text-sm">
    <thead class="bg-gray-100">
        <tr>
            <th class="border border-gray-300 p-2 text-left">Формат</th>
            <th class="border border-gray-300 p-2 text-left">Точний розмір</th>
        </tr>
    </thead>
    <tbody>
        <tr><td class="border border-gray-300 p-2 text-center bg-yellow-50/50">9x13</td><td class="border border-gray-300 p-2 bg-yellow-50/50">89x127mm</td></tr>
        <tr><td class="border border-gray-300 p-2 text-center">13x18</td><td class="border border-gray-300 p-2">127x178mm</td></tr>
        <tr><td class="border border-gray-300 p-2 text-center bg-yellow-50/50">10x15</td><td class="border border-gray-300 p-2 bg-yellow-50/50">100x152mm</td></tr>
        <tr>
            <td class="border border-gray-300 p-2 text-center align-middle" rowspan="3">15x20</td>
            <td class="border border-gray-300 p-2">152x203mm</td>
        </tr>
        <tr><td class="border border-gray-300 p-2">152x210mm</td></tr>
        <tr><td class="border border-gray-300 p-2">152x216mm</td></tr>
        <tr><td class="border border-gray-300 p-2 text-center bg-yellow-50/50">20x30</td><td class="border border-gray-300 p-2 bg-yellow-50/50">203x305mm</td></tr>
    </tbody>
</table>
<div class="space-y-4 text-sm text-gray-800">
    <p><strong>Тип фотографій JPEG (розширення jpg, jpeg), колірна модель RGB.</strong></p>
    <p>Для отримання точних геометричних розмірів фотознімку, крім точних розмірів, потрібно вказати роздільну здатність знімка 300dpi (точок на дюйм). У всіх інших випадках це необов'язково, але роздільна здатність не повинна перевищувати позначку в 300dpi.</p>
    <div class="p-4 bg-red-50 border border-red-100 rounded-lg text-red-900">
        <p><strong>Важливо:</strong> Намагайтеся не розміщувати важливих елементів і написів близько ("впритул") до краю фотографії, оскільки в результаті поступового зносу і подальшого калібрування форматів розмір краю знімка може варіюватися в межах 2мм.</p>
    </div>
</div>`;

    const sizesContentEN = `
<h3 class="text-lg font-bold mb-4">Photo Sizes</h3>
<table class="w-full border-collapse border border-gray-300 mb-6 text-sm">
    <thead class="bg-gray-100">
        <tr>
            <th class="border border-gray-300 p-2 text-left">Size</th>
            <th class="border border-gray-300 p-2 text-left">Exact Size</th>
        </tr>
    </thead>
    <tbody>
        <tr><td class="border border-gray-300 p-2 text-center bg-yellow-50/50">9x13</td><td class="border border-gray-300 p-2 bg-yellow-50/50">89x127mm</td></tr>
        <tr><td class="border border-gray-300 p-2 text-center">13x18</td><td class="border border-gray-300 p-2">127x178mm</td></tr>
        <tr><td class="border border-gray-300 p-2 text-center bg-yellow-50/50">10x15</td><td class="border border-gray-300 p-2 bg-yellow-50/50">100x152mm</td></tr>
        <tr>
            <td class="border border-gray-300 p-2 text-center align-middle" rowspan="3">15x20</td>
            <td class="border border-gray-300 p-2">152x203mm</td>
        </tr>
        <tr><td class="border border-gray-300 p-2">152x210mm</td></tr>
        <tr><td class="border border-gray-300 p-2">152x216mm</td></tr>
        <tr><td class="border border-gray-300 p-2 text-center bg-yellow-50/50">20x30</td><td class="border border-gray-300 p-2 bg-yellow-50/50">203x305mm</td></tr>
    </tbody>
</table>
<div class="space-y-4 text-sm text-gray-800">
    <p><strong>Photo type JPEG (extension jpg, jpeg), color model RGB.</strong></p>
    <p>To obtain exact geometric dimensions of the photograph, in addition to exact dimensions, a resolution of 300dpi (dots per inch) must be specified. In all other cases this is not mandatory, but resolution should not exceed 300dpi.</p>
    <div class="p-4 bg-red-50 border border-red-100 rounded-lg text-red-900">
        <p><strong>Important:</strong> Try not to place important elements and text too close to the edge of the photo, as due to gradual wear and subsequent calibration of print dimensions, the border size of the print may vary within 2mm.</p>
    </div>
</div>`;

    await prisma.helpArticle.upsert({
        where: { slug: 'photo-sizes' },
        update: {},
        create: {
            helpCategoryId: catGeneral.id,
            slug: 'photo-sizes',
            sortOrder: 2,
            translations: {
                create: [
                    { lang: 'ru', title: 'Размеры фотографий', content: sizesContentRU },
                    { lang: 'uk', title: 'Розміри фотографій', content: sizesContentUK },
                    { lang: 'en', title: 'Photo Sizes', content: sizesContentEN }
                ]
            }
        }
    });

    // 2. Why cropped? - Independent Page

    // -- RU Content
    const croppingContentRU = `
<div class="prose max-w-none text-slate-800">
    <p class="mb-4 text-justify">
        Изначально форматы печати рассчитывались под наиболее распространенные форматы кадров. На рассвете пленочной эры большинство любительских камер снимало на пленку 135-го типа в формате кадра 24х36 мм. Соотношение сторон такого кадра <b>2:3</b> — именно под него создавались форматы печати 10х15, 20х30, 30х45 и др.
    </p>
    <p class="mb-4 text-justify">
        С появлением цифровых фотоаппаратов производители стали ориентироваться на формат компьютерных мониторов, который в большинстве случаев близок к соотношению сторон <b>3:4</b>. На сегодняшний день распространены камеры обоих типов:
    </p>
    <ul class="list-disc pl-5 mb-6 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <li>с соотношением сторон кадра <span class="font-bold text-slate-700">2:3</span> (как правило, цифровые зеркальные камеры, пленочные фотоаппараты);</li>
        <li>с соотношением сторон кадра <span class="font-bold text-slate-700">3:4</span> (как правило, цифровые любительские камеры).</li>
    </ul>
    
    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
        <p class="font-medium text-amber-900">
            Если напечатать кадр 3:4 в формате 10х15 (который имеет соотношение 2:3), то значительная часть изображения либо останется за пределами печати, либо на снимке образуются широкие белые поля (в зависимости от режима печати).
        </p>
    </div>

    <p class="mb-4">
        Так как в общем виде любой файл имеет произвольные размеры (произвольные соотношения сторон), то при его печати в любом стандартном формате всегда есть вероятность что часть фото обрежет.
    </p>
    <p class="mb-4 font-semibold">
        Что же нужно делать заказчику фотографий, если по какой-то причине на фотоснимке любой элемент важный, и хотелось бы его сохранить?
    </p>
    <p class="mb-4">
        Наша фотолаборатория позволяет напечатать фотоснимок в следующих режимах:
    </p>

    <div class="space-y-8 mt-6">
        
        <div class="flex flex-col md:flex-row gap-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <div class="w-full md:w-1/3 flex-shrink-0">
                <div class="rounded-lg overflow-hidden border border-slate-200">
                    <img src="/images/help/orig.jpg" alt="Оригинал" class="w-full h-auto object-cover" />
                </div>
            </div>
            <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-xl font-bold text-slate-900 mb-2">Оригинал</h3>
                <p class="text-slate-600">
                    Снимок полученный с любительской цифровой камеры, и так мы его видим на экране монитора.
                </p>
            </div>
        </div>

        <div class="flex flex-col md:flex-row gap-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
             <div class="w-full md:w-1/3 flex-shrink-0">
                <div class="rounded-lg overflow-hidden border border-slate-200 relative">
                    <img src="/images/help/crop.jpg" alt="Free Cropping" class="w-full h-auto object-cover" />
                </div>
            </div>
            <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-xl font-bold text-slate-900 mb-2">Free Cropping (произвольная обрезка)</h3>
                <p class="text-slate-600 mb-2">
                    Приблизительно так кадрируется фотография, когда нет особых требований к обрезке.
                </p>
                <p class="text-slate-500 text-sm">
                    Оператор печати сам решает какая часть снимка менее значительна, и при печати обрезает её.
                </p>
            </div>
        </div>

        <div class="flex flex-col md:flex-row gap-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
             <div class="w-full md:w-1/3 flex-shrink-0">
                <div class="rounded-lg overflow-hidden border border-slate-200">
                    <img src="/images/help/no_crop.jpg" alt="Fit-in" class="w-full h-auto object-cover" />
                </div>
            </div>
            <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-xl font-bold text-slate-900 mb-2">Fit-in (НЕ ОБРЕЗАТЬ)</h3>
                <p class="text-slate-600 mb-2">
                    Если любая часть фотографии важна, и обрезка недопустима, то при заказе указывают данный режим печати.
                </p>
                <div class="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                     Единственный его недостаток, это белые поля по краям фотографии, которые возникают из-за разных соотношений сторон фотографии, и формата на котором печатается фото.
                </div>
            </div>
        </div>

    </div>

    <div class="mt-8 p-4 rounded-xl bg-slate-100 border border-slate-200">
        <h4 class="font-bold text-slate-800 mb-2">No Resize (без масштабирования)</h4>
        <p class="text-slate-600 text-sm">
            Отдельный режим печати, предназначен для пользователей владеющих графическими редакторами, и способных самостоятельно откадрировать снимок точно под наши размеры печати.
        </p>
    </div>
</div>
    `;

    // -- UK Content
    const croppingContentUK = `
<div class="prose max-w-none text-slate-800">
    <p class="mb-4 text-justify">
        Спочатку формати друку розраховувалися під найбільш поширені формати кадрів. На світанку плівкової ери більшість аматорських камер знімало на плівку 135-го типу у форматі кадру 24х36 мм. Співвідношення сторін такого кадру <b>2:3</b> — саме під нього створювалися формати друку 10х15, 20х30, 30х45 та ін.
    </p>
    <p class="mb-4 text-justify">
        З появою цифрових фотоапаратів виробники стали орієнтуватися на формат комп'ютерних моніторів, який у більшості випадків близький до співвідношення сторін <b>3:4</b>. На сьогоднішній день поширені камери обох типів:
    </p>
    <ul class="list-disc pl-5 mb-6 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <li>зі співвідношенням сторін кадру <span class="font-bold text-slate-700">2:3</span> (як правило, цифрові дзеркальні камери, плівкові фотоапарати);</li>
        <li>зі співвідношенням сторін кадру <span class="font-bold text-slate-700">3:4</span> (як правило, цифрові аматорські камери).</li>
    </ul>
    
    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
        <p class="font-medium text-amber-900">
            Якщо надрукувати кадр 3:4 у форматі 10х15 (який має співвідношення 2:3), то значна частина зображення або залишиться за межами друку, або на знімку утворяться широкі білі поля (залежно від режиму друку).
        </p>
    </div>

    <p class="mb-4">
        Так як у загальному вигляді будь-який файл має довільні розміри (довільні співвідношення сторін), то при його друку в будь-якому стандартному форматі завжди є ймовірність що частина фото обріжеться.
    </p>
    <p class="mb-4">
        Наша фотолабораторія дозволяє надрукувати фотознімок у наступних режимах:
    </p>

    <div class="space-y-8 mt-6">
        
        <div class="flex flex-col md:flex-row gap-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <div class="w-full md:w-1/3 flex-shrink-0">
                <div class="rounded-lg overflow-hidden border border-slate-200">
                    <img src="/images/help/orig.jpg" alt="Оригінал" class="w-full h-auto object-cover" />
                </div>
            </div>
            <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-xl font-bold text-slate-900 mb-2">Оригінал</h3>
                <p class="text-slate-600">
                    Знімок отриманий з аматорської цифрової камери, і так ми його бачимо на екрані монітора.
                </p>
            </div>
        </div>

        <div class="flex flex-col md:flex-row gap-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
             <div class="w-full md:w-1/3 flex-shrink-0">
                <div class="rounded-lg overflow-hidden border border-slate-200 relative">
                    <img src="/images/help/crop.jpg" alt="Free Cropping" class="w-full h-auto object-cover" />
                </div>
            </div>
            <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-xl font-bold text-slate-900 mb-2">Free Cropping (довільна обрізка)</h3>
                <p class="text-slate-600 mb-2">
                    Приблизно так кадрується фотографія, коли немає особливих вимог до обрізки.
                </p>
                <p class="text-slate-500 text-sm">
                    Оператор друку сам вирішує яка частина знімка менш значна, і при друку обрізає її.
                </p>
            </div>
        </div>

        <div class="flex flex-col md:flex-row gap-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
             <div class="w-full md:w-1/3 flex-shrink-0">
                <div class="rounded-lg overflow-hidden border border-slate-200">
                    <img src="/images/help/no_crop.jpg" alt="Fit-in" class="w-full h-auto object-cover" />
                </div>
            </div>
            <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-xl font-bold text-slate-900 mb-2">Fit-in (НЕ ОБРІЗАТИ)</h3>
                <p class="text-slate-600 mb-2">
                    Якщо будь-яка частина фотографії важлива, і обрізка неприпустима, то при замовленні вказують даний режим друку.
                </p>
                <div class="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                     Єдиний його недолік, це білі поля по краях фотографії, які виникають через різні співвідношення сторін фотографії, і формату на якому друкується фото.
                </div>
            </div>
        </div>

    </div>

    <div class="mt-8 p-4 rounded-xl bg-slate-100 border border-slate-200">
        <h4 class="font-bold text-slate-800 mb-2">No Resize (без масштабування)</h4>
        <p class="text-slate-600 text-sm">
            Окремий режим друку, призначений для користувачів, що володіють графічними редакторами, і здатних самостійно відкадрувати знімок точно під наші розміри друку.
        </p>
    </div>
</div>
    `;

    // -- EN Content
    const croppingContentEN = `
<div class="prose max-w-none text-slate-800">
    <p class="mb-4 text-justify">
        Initially, print formats were calculated for the most common frame formats. At the dawn of the film era, most amateur cameras shot on 135 type film in 24x36 mm frame format. The aspect ratio of such a frame is <b>2:3</b> — print formats 10x15, 20x30, 30x45 etc. were created specifically for it.
    </p>
    <p class="mb-4 text-justify">
        With the advent of digital cameras, manufacturers began to focus on the format of computer monitors, which in most cases is close to the aspect ratio of <b>3:4</b>. Today, cameras of both types are common:
    </p>
    <ul class="list-disc pl-5 mb-6 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <li>Frame aspect ratio <span class="font-bold text-slate-700">2:3</span> (usually digital SLR cameras, film cameras);</li>
        <li>Frame aspect ratio <span class="font-bold text-slate-700">3:4</span> (usually digital amateur cameras).</li>
    </ul>
    
    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
        <p class="font-medium text-amber-900">
            If you print a 3:4 frame in 10x15 format (which is 2:3), a significant part of the image will either remain outside the print area, or wide white borders will form on the picture (depending on the print mode).
        </p>
    </div>

    <p class="mb-4">
        Since any file generally has arbitrary dimensions (arbitrary aspect ratios), when printing in any standard format there is always a probability that part of the photo will be cropped.
    </p>
    <p class="mb-4">
        Our photo lab allows you to print photos in the following modes:
    </p>

    <div class="space-y-8 mt-6">
        
        <div class="flex flex-col md:flex-row gap-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <div class="w-full md:w-1/3 flex-shrink-0">
                <div class="rounded-lg overflow-hidden border border-slate-200">
                    <img src="/images/help/orig.jpg" alt="Original" class="w-full h-auto object-cover" />
                </div>
            </div>
            <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-xl font-bold text-slate-900 mb-2">Original</h3>
                <p class="text-slate-600">
                    A snapshot obtained from an amateur digital camera, as we see it on the monitor screen.
                </p>
            </div>
        </div>

        <div class="flex flex-col md:flex-row gap-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
             <div class="w-full md:w-1/3 flex-shrink-0">
                <div class="rounded-lg overflow-hidden border border-slate-200 relative">
                    <img src="/images/help/crop.jpg" alt="Free Cropping" class="w-full h-auto object-cover" />
                </div>
            </div>
            <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-xl font-bold text-slate-900 mb-2">Free Cropping</h3>
                <p class="text-slate-600 mb-2">
                    The photo is cropped approximately like this when there are no special cropping requirements.
                </p>
                <p class="text-slate-500 text-sm">
                    The print operator decides which part of the shot is less significant and crops it during printing.
                </p>
            </div>
        </div>

        <div class="flex flex-col md:flex-row gap-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
             <div class="w-full md:w-1/3 flex-shrink-0">
                <div class="rounded-lg overflow-hidden border border-slate-200">
                    <img src="/images/help/no_crop.jpg" alt="Fit-in" class="w-full h-auto object-cover" />
                </div>
            </div>
            <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-xl font-bold text-slate-900 mb-2">Fit-in (NO CROP)</h3>
                <p class="text-slate-600 mb-2">
                    If any part of the photo is important and cropping is unacceptable, this print mode is specified when ordering.
                </p>
                <div class="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                     Its only drawback is white borders on the edges of the photo, which occur due to different aspect ratios of the photo and the format on which the photo is printed.
                </div>
            </div>
        </div>

    </div>

    <div class="mt-8 p-4 rounded-xl bg-slate-100 border border-slate-200">
        <h4 class="font-bold text-slate-800 mb-2">No Resize</h4>
        <p class="text-slate-600 text-sm">
            A separate print mode intended for users who know how to use graphic editors and are capable of independently cropping the image exactly to our print dimensions.
        </p>
    </div>
</div>
    `;

    // Ensure the content variables (croppingContentRU, etc.) are defined only ONCE before this block.

    await prisma.helpArticle.upsert({
        where: { slug: 'why-cropped' },
        update: {},
        create: {
            helpCategoryId: catGeneral.id,
            slug: 'why-cropped',
            sortOrder: 2,
            translations: {
                create: [
                    { lang: 'ru', title: 'Почему фотография при печати обрезаются', content: croppingContentRU },
                    { lang: 'uk', title: 'Чому фотографія при друку обрізається', content: croppingContentUK },
                    { lang: 'en', title: 'Why photos are cropped when printed', content: croppingContentEN }
                ]
            }
        } as any
    });

    // 3. Equipment - Independent Page
    await prisma.helpArticle.upsert({
        where: { slug: 'equipment' },
        update: {},
        create: {
            helpCategoryId: catGeneral.id,
            slug: 'equipment',
            sortOrder: 3,
            translations: {
                create: [
                    {
                        lang: 'ru',
                        title: 'Наше оборудование и материалы',
                        content: `
<div class="prose max-w-none text-slate-800">
    <h3 class="text-3xl font-bold text-[#009846] mb-6">Наше оборудование и материалы</h3>

    <!-- Frontier 500 Section -->
    <div class="flex flex-col md:flex-row gap-8 mb-12">
        <div class="w-full md:w-1/3 flex-shrink-0">
             <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                <img src="/images/help/frontier500.png" alt="Fuji Frontier 500" class="w-full h-auto object-contain mx-auto mb-2" />
                <p class="text-sm font-bold text-slate-500">Fujifilm Frontier 500</p>
             </div>
        </div>
        <div class="flex-1">
            <p class="text-lg mb-4">
                Мы работаем на современной, высокоскоростной компактной цифровой минилаборатории <span class="font-bold text-[#009846]">Fuji Frontier 500</span> — это лучшее решение для получения высококачественных цифровых отпечатков.
            </p>
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>⚡</span> Характеристики и преимущества
                </h4>
                <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Высокая эффективность</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Высококачественная лазерная система экспонирования</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Новейшее программное обеспечение</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Скорость печати до 800 отпечатков 10х15 см в час</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Пониженное энергопотребление</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Максимальный формат печати — А4 (21х30)</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Основа системы "Fujifilm Digital Imaging"</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Image Intelligence Section -->
    <div class="flex flex-col-reverse md:flex-row gap-8 mb-12 items-center bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <div class="flex-1">
            <h4 class="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
                Image Intelligence™ <span class="text-sm font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Технология</span>
            </h4>
            <p class="mb-4 text-blue-900">
                Накопленные Fujifilm за последние 7 десятилетий знания воплотились в мощные алгоритмы обработки.
            </p>
            <p class="text-sm text-blue-800 leading-relaxed text-justify">
                Технология <b>"Image Intelligence"</b> автоматически компенсирует недостаточное освещение и другие проблемные условия съемки, а также позволяет добиться более естественных оттенков кожи. Коррекция выполняется автоматически, обеспечивая оптимальный результат даже для снимков, сделанных в сложных условиях.
            </p>
        </div>
        <div class="w-full md:w-1/4 flex-shrink-0">
             <div class="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center justify-center">
                <img src="/images/help/image-intelligence.jpg" alt="Image Intelligence" class="max-w-full h-auto" />
             </div>
        </div>
    </div>

    <!-- Paper Section -->
    <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h4 class="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
            Фотобумага FUJICOLOR CRYSTAL ARCHIVE PAPER
        </h4>
        
        <div class="flex flex-col md:flex-row gap-8">
            <div class="w-full md:w-1/4 flex-shrink-0">
                <div class="bg-white p-2 rounded-xl border border-slate-200 shadow-sm rotate-1 hover:rotate-0 transition-transform duration-300">
                    <img src="/images/help/crystalarhive.jpg" alt="Fujicolor Paper" class="w-full h-auto rounded" />
                </div>
            </div>
            <div class="flex-1">
                <p class="font-bold text-lg mb-2 text-slate-800">
                    Профессиональное качество для любительской фотографии.
                </p>
                <p class="text-slate-600 mb-4 italic">
                    Высокая стабильность цвета, высокая белизна бумаги, чистые цвета, точная цветопередача.
                </p>
                <p class="mb-6 text-justify">
                    <b>FUJICOLOR CRYSTAL ARCHIVE PAPER</b> представляет собой цветную фотобумагу с галогенидами серебра, предназначенную для создания высококачественных цветных отпечатков. Она создана на основе новой технологии нанесения слоев для улучшенного воспроизведения цветов и чистого белого цвета.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <h5 class="font-bold text-[#009846] mb-1">Яркие цвета</h5>
                        <p class="text-xs text-slate-600">Сохраняются великолепные цвета, нежные оттенки зеленого, яркие синие и красные.</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <h5 class="font-bold text-[#009846] mb-1">Идеальный белый</h5>
                        <p class="text-xs text-slate-600">Блестящая передача белого цвета и улучшенная детализация в светлых тонах.</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <h5 class="font-bold text-[#009846] mb-1">Долговечность</h5>
                        <p class="text-xs text-slate-600">Отличная стойкость изображения. Не выцветает при длительном хранении.</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <h5 class="font-bold text-[#009846] mb-1">Прочность</h5>
                        <p class="text-xs text-slate-600">Нечувствительность к механическим воздействиям.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
                        `
                    },
                    {
                        lang: 'uk',
                        title: 'Наше обладнання та матеріали',
                        content: `
<div class="prose max-w-none text-slate-800">
    <h3 class="text-3xl font-bold text-[#009846] mb-6">Наше обладнання та матеріали</h3>

    <!-- Frontier 500 Section -->
    <div class="flex flex-col md:flex-row gap-8 mb-12">
        <div class="w-full md:w-1/3 flex-shrink-0">
             <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                <img src="/images/help/frontier500.png" alt="Fuji Frontier 500" class="w-full h-auto object-contain mx-auto mb-2" />
                <p class="text-sm font-bold text-slate-500">Fujifilm Frontier 500</p>
             </div>
        </div>
        <div class="flex-1">
            <p class="text-lg mb-4">
                Ми працюємо на сучасній, високошвидкісній компактній цифровій мінілабораторії <span class="font-bold text-[#009846]">Fuji Frontier 500</span> — це найкраще рішення для отримання високоякісних цифрових відбитків.
            </p>
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>⚡</span> Характеристики та переваги
                </h4>
                <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Висока ефективність</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Високоякісна лазерна система експонування</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Новітнє програмне забезпечення</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Швидкість друку до 800 відбитків 10х15 см на годину</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Знижене енергоспоживання</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Максимальний формат друку — А4 (21х30)</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Основа системи "Fujifilm Digital Imaging"</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Image Intelligence Section -->
    <div class="flex flex-col-reverse md:flex-row gap-8 mb-12 items-center bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <div class="flex-1">
            <h4 class="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
                Image Intelligence™ <span class="text-sm font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Технологія</span>
            </h4>
            <p class="mb-4 text-blue-900">
                Накопичені Fujifilm за останні 7 десятиліть знання втілилися в потужні алгоритми обробки.
            </p>
            <p class="text-sm text-blue-800 leading-relaxed text-justify">
                Технологія <b>"Image Intelligence"</b> автоматично компенсує недостатнє освітлення та інші проблемні умови зйомки, а також дозволяє домогтися більш природних відтінків шкіри. Корекція виконується автоматично, забезпечуючи оптимальний результат навіть для знімків, зроблених у складних умовах.
            </p>
        </div>
        <div class="w-full md:w-1/4 flex-shrink-0">
             <div class="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center justify-center">
                <img src="/images/help/image-intelligence.jpg" alt="Image Intelligence" class="max-w-full h-auto" />
             </div>
        </div>
    </div>

    <!-- Paper Section -->
    <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h4 class="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
            Фотопапір FUJICOLOR CRYSTAL ARCHIVE PAPER
        </h4>
        
        <div class="flex flex-col md:flex-row gap-8">
            <div class="w-full md:w-1/4 flex-shrink-0">
                <div class="bg-white p-2 rounded-xl border border-slate-200 shadow-sm rotate-1 hover:rotate-0 transition-transform duration-300">
                    <img src="/images/help/crystalarhive.jpg" alt="Fujicolor Paper" class="w-full h-auto rounded" />
                </div>
            </div>
            <div class="flex-1">
                <p class="font-bold text-lg mb-2 text-slate-800">
                    Професійна якість для аматорської фотографії.
                </p>
                <p class="text-slate-600 mb-4 italic">
                    Висока стабільність кольору, висока білизна паперу, чисті кольори, точна передача кольору.
                </p>
                <p class="mb-6 text-justify">
                    <b>FUJICOLOR CRYSTAL ARCHIVE PAPER</b> являє собою кольоровий фотопапір з галогенідами срібла, призначений для створення високоякісних кольорових відбитків. Він створений на основі нової технології нанесення шарів для поліпшеного відтворення кольорів і чистого білого кольору.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <h5 class="font-bold text-[#009846] mb-1">Яскраві кольори</h5>
                        <p class="text-xs text-slate-600">Зберігаються чудові кольори, ніжні відтінки зеленого, яскраві сині та червоні.</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <h5 class="font-bold text-[#009846] mb-1">Ідеальний білий</h5>
                        <p class="text-xs text-slate-600">Блискуча передача білого кольору та покращена деталізація у світлих тонах.</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <h5 class="font-bold text-[#009846] mb-1">Довговічність</h5>
                        <p class="text-xs text-slate-600">Відмінна стійкість зображення. Не вицвітає при тривалому зберіганні.</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <h5 class="font-bold text-[#009846] mb-1">Міцність</h5>
                        <p class="text-xs text-slate-600">Нечутливість до механічних впливів.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
                        `
                    },
                    {
                        lang: 'en',
                        title: 'Our Equipment and Materials',
                        content: `
<div class="prose max-w-none text-slate-800">
    <h3 class="text-3xl font-bold text-[#009846] mb-6">Our Equipment and Materials</h3>

    <!-- Frontier 500 Section -->
    <div class="flex flex-col md:flex-row gap-8 mb-12">
        <div class="w-full md:w-1/3 flex-shrink-0">
             <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                <img src="/images/help/frontier500.png" alt="Fuji Frontier 500" class="w-full h-auto object-contain mx-auto mb-2" />
                <p class="text-sm font-bold text-slate-500">Fujifilm Frontier 500</p>
             </div>
        </div>
        <div class="flex-1">
            <p class="text-lg mb-4">
                We work on a modern, high-speed compact digital minilab <span class="font-bold text-[#009846]">Fuji Frontier 500</span> — it is the best solution for obtaining high-quality digital prints.
            </p>
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>⚡</span> Features and Benefits
                </h4>
                <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>High efficiency</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>High-quality laser exposure system</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Newest software</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Print speed up to 800 prints (10x15) per hour</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Reduced power consumption</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Maximum print format — A4 (21x30)</li>
                    <li class="flex items-start gap-2"><div class="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#009846] flex-shrink-0"></div>Based on "Fujifilm Digital Imaging" system</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Image Intelligence Section -->
    <div class="flex flex-col-reverse md:flex-row gap-8 mb-12 items-center bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <div class="flex-1">
            <h4 class="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
                Image Intelligence™ <span class="text-sm font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Technology</span>
            </h4>
            <p class="mb-4 text-blue-900">
                Knowledge accumulated by Fujifilm over the last 7 decades embodied in powerful processing algorithms.
            </p>
            <p class="text-sm text-blue-800 leading-relaxed text-justify">
                <b>"Image Intelligence"</b> technology automatically compensates for insufficient lighting and other problematic shooting conditions, and also achieves more natural skin tones. Correction is performed automatically, ensuring optimal results even for shots taken in difficult conditions.
            </p>
        </div>
        <div class="w-full md:w-1/4 flex-shrink-0">
             <div class="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center justify-center">
                <img src="/images/help/image-intelligence.jpg" alt="Image Intelligence" class="max-w-full h-auto" />
             </div>
        </div>
    </div>

    <!-- Paper Section -->
    <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h4 class="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
            FUJICOLOR CRYSTAL ARCHIVE PAPER
        </h4>
        
        <div class="flex flex-col md:flex-row gap-8">
            <div class="w-full md:w-1/4 flex-shrink-0">
                <div class="bg-white p-2 rounded-xl border border-slate-200 shadow-sm rotate-1 hover:rotate-0 transition-transform duration-300">
                    <img src="/images/help/crystalarhive.jpg" alt="Fujicolor Paper" class="w-full h-auto rounded" />
                </div>
            </div>
            <div class="flex-1">
                <p class="font-bold text-lg mb-2 text-slate-800">
                    Professional quality for amateur photography.
                </p>
                <p class="text-slate-600 mb-4 italic">
                    High color stability, high paper whiteness, pure colors, accurate color reproduction.
                </p>
                <p class="mb-6 text-justify">
                    <b>FUJICOLOR CRYSTAL ARCHIVE PAPER</b> is a silver halide color photo paper designed to create high-quality color prints. It is created based on new layer technology for improved color reproduction and pure white color.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <h5 class="font-bold text-[#009846] mb-1">Vivid Colors</h5>
                        <p class="text-xs text-slate-600">Preserves magnificent colors, delicate green shades, bright blues and reds.</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <h5 class="font-bold text-[#009846] mb-1">Perfect White</h5>
                        <p class="text-xs text-slate-600">Brilliant white reproduction and improved detail in highlights.</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <h5 class="font-bold text-[#009846] mb-1">Durability</h5>
                        <p class="text-xs text-slate-600">Excellent image stability. Does not fade during long-term storage.</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <h5 class="font-bold text-[#009846] mb-1">Robustness</h5>
                        <p class="text-xs text-slate-600">Insensitivity to mechanical impacts.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
                        `
                    }
                ]
            }
        } as any
    });

    // 10. Order Sequence
    console.log('Seeding Order Sequence...');
    // Use try-catch or explicit check to avoid errors if model not generated yet (though logic implies it should exist)
    // Assuming model is generated
    const seq = await prisma.orderSequence.findFirst();
    if (!seq) {
        await prisma.orderSequence.create({ data: { currentValue: 10000 } });
    }

        // 11. General Settings (FROM FILE)
    console.log('Seeding Settings from JSON...');
    const settings = loadJSON('settings.json');
    if (settings && settings.length > 0) {
        for (const s of settings) {
            await prisma.setting.upsert({
                where: { key: s.key },
                update: { value: s.value },
                create: { key: s.key, value: s.value, description: s.description || s.key }
            });
        }
    }

    
console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
