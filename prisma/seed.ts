import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    // 1. Paper Types
    await prisma.paperType.upsert({ where: { slug: 'glossy' }, update: {}, create: { name: 'Glossy', slug: 'glossy' } })
    await prisma.paperType.upsert({ where: { slug: 'matte' }, update: {}, create: { name: 'Matte', slug: 'matte' } })

    // 2. Print Options
    await prisma.printOption.upsert({ where: { slug: 'border' }, update: {}, create: { name: 'Border', slug: 'border', price: 0, priceType: 'FIXED' } })
    await prisma.printOption.upsert({ where: { slug: 'magnetic' }, update: {}, create: { name: 'Magnetic', slug: 'magnetic', price: 15, priceType: 'FIXED' } })

    // 3. Print Sizes
    const sizes = [
        { name: '9x13', price: 3.50 },
        { name: '10x15', price: 4.00 },
        { name: '13x18', price: 5.50 },
        { name: '15x20', price: 7.00 },
        { name: '20x30', price: 15.00 },
    ]

    for (const s of sizes) {
        await prisma.printSize.upsert({
            where: { slug: s.name },
            update: {},
            create: { name: s.name, slug: s.name, basePrice: s.price }
        })
    }

    // 4. Translations (Basic + Checkout)
    const translations = [
        { key: 'nav.upload', val: { uk: 'Завантажити', en: 'Upload', ru: 'Загрузить' } },
        { key: 'nav.pricing', val: { uk: 'Ціни', en: 'Pricing', ru: 'Цены' } },
        { key: 'hero.title', val: { uk: 'Друк фото онлайн', en: 'Online Photo Printing', ru: 'Печать фото онлайн' } },
        { key: 'hero.subtitle', val: { uk: 'Якісно та швидко', en: 'Quality & Fast', ru: 'Качественно и быстро' } },
        { key: 'checkout.summary', val: { uk: 'Підсумок замовлення', en: 'Order Summary', ru: 'Итог заказа' } },
        { key: 'checkout.total', val: { uk: 'Всього', en: 'Total', ru: 'Всего' } },
        { key: 'checkout.bonus', val: { uk: 'Бонус', en: 'Bonus', ru: 'Бонус' } },
        { key: 'checkout.free', val: { uk: 'Безкоштовно', en: 'Free', ru: 'Бесплатно' } },
        { key: 'checkout.placeOrder', val: { uk: 'Оформити замовлення', en: 'Place Order', ru: 'Оформить заказ' } },
    ]

    for (const t of translations) {
        await prisma.translation.upsert({ where: { lang_key: { lang: 'uk', key: t.key } }, update: { value: t.val.uk }, create: { lang: 'uk', key: t.key, value: t.val.uk } })
        await prisma.translation.upsert({ where: { lang_key: { lang: 'en', key: t.key } }, update: { value: t.val.en }, create: { lang: 'en', key: t.key, value: t.val.en } })
        await prisma.translation.upsert({ where: { lang_key: { lang: 'ru', key: t.key } }, update: { value: t.val.ru }, create: { lang: 'ru', key: t.key, value: t.val.ru } })
    }

    // 5. Sample Volume Discounts & Gifts
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

    await prisma.giftThreshold.upsert({
        where: { id: 1 },
        update: { minAmount: 1000, giftName: 'Free 10x15 Print', isActive: true },
        create: { id: 1, minAmount: 1000, giftName: 'Free 10x15 Print', isActive: true }
    });

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
