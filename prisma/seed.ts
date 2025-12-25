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

    // 4. Translations (Extensive)
    const translations = [
        // Navigation
        { key: 'nav.upload', val: { uk: 'Завантажити фотографії', en: 'Upload Photos', ru: 'Закачать фотографии' } },
        { key: 'nav.pricing', val: { uk: 'Ціни', en: 'Pricing', ru: 'Цены' } },
        { key: 'nav.about', val: { uk: 'Про нас', en: 'About US', ru: 'О нас' } },
        { key: 'nav.contact', val: { uk: 'Контакти', en: 'Contact', ru: 'Контакты' } },
        { key: 'nav.help', val: { uk: 'Допомога', en: 'Help', ru: 'Помощь' } },
        { key: 'nav.signin', val: { uk: 'Увійти', en: 'Sign In', ru: 'Войти' } },

        // Checkout UI
        { key: 'checkout.summary', val: { uk: 'Підсумок замовлення', en: 'Order Summary', ru: 'Итог заказа' } },
        { key: 'checkout.total', val: { uk: 'Всього', en: 'Total', ru: 'Всего' } },
        { key: 'checkout.bonus', val: { uk: 'Бонус', en: 'Bonus', ru: 'Бонус' } },
        { key: 'checkout.free', val: { uk: 'Безкоштовно', en: 'Free', ru: 'Бесплатно' } },
        { key: 'checkout.placeOrder', val: { uk: 'Оформити замовлення', en: 'Place Order', ru: 'Оформить заказ' } },
        { key: 'common.processing', val: { uk: 'Обробка...', en: 'Processing...', ru: 'Обработка...' } },

        // Options Labels
        { key: 'Border', val: { uk: 'З рамкою', en: 'With Border', ru: 'С рамкой' } },
        { key: 'Magnet', val: { uk: 'Магніт', en: 'Magnet', ru: 'Магнит' } },
        { key: 'prints', val: { uk: 'шт.', en: 'pcs.', ru: 'шт.' } },

        // Admin Sidebar
        { key: 'admin.dashboard', val: { uk: 'Панель', en: 'Dashboard', ru: 'Панель' } },
        { key: 'admin.orders', val: { uk: 'Замовлення', en: 'Orders', ru: 'Заказы' } },
        { key: 'admin.content', val: { uk: 'Медіа / Контент', en: 'Media / Content', ru: 'Медиа / Контент' } },
        { key: 'admin.users', val: { uk: 'Користувачі', en: 'Users', ru: 'Пользователи' } },
        { key: 'admin.pages', val: { uk: 'Сторінки CMS', en: 'CMS Pages', ru: 'Страницы CMS' } },
        { key: 'admin.translations', val: { uk: 'Переклади', en: 'Translations', ru: 'Переводы' } },
        { key: 'admin.settings', val: { uk: 'Налаштування', en: 'Global Settings', ru: 'Настройки' } },
        { key: 'admin.config', val: { uk: 'Конфігурація', en: 'System Config', ru: 'Конфигурация' } },

        // Config Submenu
        { key: 'config.sizes', val: { uk: 'Розміри', en: 'Print Sizes', ru: 'Размеры' } },
        { key: 'config.papers', val: { uk: 'Типи паперу', en: 'Paper Types', ru: 'Типы бумаги' } },
        { key: 'config.options', val: { uk: 'Опції', en: 'Extra Options', ru: 'Опции' } },
        { key: 'config.gifts', val: { uk: 'Подарунки', en: 'Gifts', ru: 'Подарки' } },
        { key: 'config.discounts', val: { uk: 'Знижки', en: 'Discounts', ru: 'Скидки' } },

        // Misc
        { key: 'Upload your photos to get started', val: { uk: 'Завантажте фотографії щоб почати', en: 'Upload your photos to get started', ru: 'Загрузите фотографии чтобы начать' } },
        { key: 'Supports JPG, PNG • Best quality guaranteed', val: { uk: 'Підтримка JPG, PNG • Найкраща якість гарантована', en: 'Supports JPG, PNG • Best quality guaranteed', ru: 'Поддержка JPG, PNG • Лучшее качество гарантировано' } },
        { key: 'Professional photo printing with high-quality Fuji materials. Choose your size and options below.', val: { uk: 'Професійний фотодрук на якісних матеріалах Fuji. Оберіть розмір та опції.', en: 'Professional photo printing with high-quality Fuji materials. Choose your size and options below.', ru: 'Профессиональная фотопечать на качественных материалах Fuji. Выберите размер и опции.' } },
        { key: 'Selected Photos', val: { uk: 'Обрані фото', en: 'Selected Photos', ru: 'Выбранные фото' } },
        { key: 'Select Files', val: { uk: 'Обрати файли', en: 'Select Files', ru: 'Выбрать файлы' } },
        { key: 'Drag & drop photos here, or click to select', val: { uk: 'Перетягніть фотографії сюди або натисніть для вибору', en: 'Drag & drop photos here, or click to select', ru: 'Перетащите фотографии сюда или нажмите для выбора' } },
        { key: 'No bulk discounts available', val: { uk: 'Оптові знижки відсутні', en: 'No bulk discounts available', ru: 'Оптовые скидки отсутствуют' } },
        { key: 'Contact Us', val: { uk: 'Зв\'яжіться з нами', en: 'Contact Us', ru: 'Свяжитесь с нами' } },
        { key: 'Total for checkout', val: { uk: 'Разом до оплати', en: 'Total for checkout', ru: 'Итого к оплате' } },
        { key: 'photos', val: { uk: 'фото', en: 'photos', ru: 'фото' } },
        { key: 'hero.title', val: { uk: 'Онлайн Фотолаб', en: 'Online Photo Lab', ru: 'Онлайн Фотолаб' } },
        { key: 'hero.subtitle', val: { uk: 'Професійний друк ваших спогадів', en: 'Professional printing of your memories', ru: 'Профессиональная печать ваших воспоминаний' } },

        { key: 'benefits.quality.title', val: { uk: 'Преміум Якість', en: 'Premium Quality', ru: 'Премиум Качество' } },
        { key: 'benefits.quality.desc', val: { uk: 'Оригінальний папір Fuji Crystal Archive для яскравих кольорів та чітких деталей.', en: 'Original Fuji Crystal Archive paper for brilliant colors and sharp details.', ru: 'Оригинальная бумага Fuji Crystal Archive для ярких цветов и четких деталей.' } },

        { key: 'benefits.discounts.title', val: { uk: 'Авто Знижки', en: 'Auto Discounts', ru: 'Авто Скидки' } },
        { key: 'benefits.discounts.desc', val: { uk: 'Замовляйте більше, платіть менше. Знижки застосовуються автоматично в кошику.', en: 'Order more, pay less. Discounts are applied automatically in your cart.', ru: 'Заказывайте больше, платите меньше. Скидки применяются автоматически в корзине.' } },

        { key: 'benefits.delivery.title', val: { uk: 'Швидка Доставка', en: 'Fast Delivery', ru: 'Быстрая Доставка' } },
        { key: 'benefits.delivery.desc', val: { uk: 'Виробництво починається відразу після завантаження. Доставка по всій Україні.', en: 'Production starts immediately after upload. Shipping across Ukraine.', ru: 'Производство начинается сразу после загрузки. Доставка по всей Украине.' } },
    ]

    for (const t of translations) {
        await prisma.translation.upsert({ where: { lang_key: { lang: 'uk', key: t.key } }, update: { value: t.val.uk }, create: { lang: 'uk', key: t.key, value: t.val.uk } })
        await prisma.translation.upsert({ where: { lang_key: { lang: 'en', key: t.key } }, update: { value: t.val.en }, create: { lang: 'en', key: t.key, value: t.val.en } })
        await prisma.translation.upsert({ where: { lang_key: { lang: 'ru', key: t.key } }, update: { value: t.val.ru }, create: { lang: 'ru', key: t.key, value: t.val.ru } })
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

    // 6. Default Informational Pages (Multilingual)
    const pages = [
        // About US
        {
            lang: 'ru', slug: 'about', title: 'О нас',
            description: 'О нашем фотоцентре Fujimir',
            content: `
                <h1 style="color: #009846;">FUJI-Мир: Профессиональный подход к вашим снимкам</h1>
                <p>Предприятие «FUJI-Мир» — лидер на рынке цифровой фотопечати...</p>
            `
        },
        {
            lang: 'uk', slug: 'about', title: 'Про нас',
            description: 'Про наш фотоцентр Fujimir',
            content: `
                <h1 style="color: #009846;">FUJI-Мир: Професійний підхід до ваших знімків</h1>
                <p>Підприємство «FUJI-Мир» — лідер на ринку цифрового фотодруку...</p>
            `
        },
        {
            lang: 'en', slug: 'about', title: 'About Us',
            description: 'About our fujimir photocenter',
            content: `
                <h1 style="color: #009846;">FUJI-MIR: Professional approach to your prints</h1>
                <p>FUJI-MIR company is a leader in the digital photo printing market...</p>
            `
        },
        // Help / FAQ
        {
            lang: 'ru', slug: 'help', title: 'Помощь (FAQ)',
            description: 'Часто задаваемые вопросы',
            content: `<h1 style="color: #009846;">Техническая информация</h1><p>Мы используем Fuji Frontier 500...</p>`
        },
        {
            lang: 'uk', slug: 'help', title: 'Допомога (FAQ)',
            description: 'Часті запитання',
            content: `<h1 style="color: #009846;">Технічна інформація</h1><p>Ми використовуємо Fuji Frontier 500...</p>`
        },
        {
            lang: 'en', slug: 'help', title: 'Help (FAQ)',
            description: 'Frequently Asked Questions',
            content: `<h1 style="color: #009846;">Technical Information</h1><p>We use Fuji Frontier 500 equipment...</p>`
        },
        // Contact
        {
            lang: 'ru', slug: 'contact', title: 'Контакты',
            description: 'Контактная информация Fujimir',
            content: `
                <h1 style="color: #009846;">Наши контакты</h1>
                <p>Адрес: г. Кременчуг, ул. Соборная (Ленина), 14/7</p>
                <p>Телефон/Viber/Telegram: (099) 215-03-17</p>
                <p>Email: fujimir@mail.ru</p>
            `
        },
        {
            lang: 'uk', slug: 'contact', title: 'Контакти',
            description: 'Контактна інформація Fujimir',
            content: `
                <h1 style="color: #009846;">Наші контакти</h1>
                <p>Адреса: м. Кременчук, вул. Соборна, 14/7</p>
                <p>Телефон/Viber/Telegram: (099) 215-03-17</p>
                <p>Email: fujimir@mail.ru</p>
            `
        },
        {
            lang: 'en', slug: 'contact', title: 'Contact',
            description: 'Contact information for Fujimir',
            content: `
                <h1 style="color: #009846;">Our Contacts</h1>
                <p>Address: Kremenchuk, Soborna st, 14/7</p>
                <p>Phone/Viber/Telegram: (099) 215-03-17</p>
                <p>Email: fujimir@mail.ru</p>
            `
        }
    ];

    // --- Migrated About Us Content ---
    const aboutContent = {
        ru: `
            <h1 class="text-2xl font-bold text-[#009846] mb-4">FUJI-Мир</h1>
            <p class="mb-4"><strong>FUJI-Мир</strong> - одно из лучших предприятий предоставляющих услуги цифровой печати фотографий как для фотолюбителей, так и для профессиональных фотографов.</p>
            <p class="mb-4">У нас вы можете заказать ряд дизайнерских услуг, таких как:</p>
            <ul class="list-disc pl-5 mb-4 space-y-1">
                <li>Сканирование фотографий и пленок</li>
                <li>Реставрация и компьютерная обработка фотографий</li>
                <li>Устранение эффекта красных глаз</li>
                <li>Разработка различных макетов и коллажей</li>
                <li>Фотографии на документы</li>
            </ul>
            <p class="mb-4">Печать производится на профессиональном оборудовании фирмы <strong>FUJI - цифровой фотолаборатории Frontier 500</strong>.</p>
            <p class="mb-4">Высочайшее качество ваших фотографий гарантировано тем, что перед печатью все файлы просматриваются оператором и в большинстве случаев мы проводим необходимую цветовую и тоновую коррекцию изображения.</p>
            <div class="mt-8 pt-4 border-t border-gray-200">
                <p><strong>Адрес:</strong> г. Днепр, ул. Европейская (Миронова), д.8</p>
                <p><strong>Телефоны:</strong> (099) 215-03-17, (098) 492-73-87</p>
                <p><strong>Время работы:</strong> с 9:30 до 18:30 без выходных</p>
            </div>
        `,
        uk: `
            <h1 class="text-2xl font-bold text-[#009846] mb-4">FUJI-Мір</h1>
            <p class="mb-4"><strong>FUJI-Мір</strong> - одне з найкращих підприємств, що надають послуги цифрового друку фотографій як для фотолюбителів, так і для професійних фотографів.</p>
            <p class="mb-4">У нас ви можете замовити ряд дизайнерських послуг, таких як:</p>
            <ul class="list-disc pl-5 mb-4 space-y-1">
                <li>Сканування фотографій та плівок</li>
                <li>Реставрація та комп'ютерна обробка фотографій</li>
                <li>Усунення ефекту червоних очей</li>
                <li>Розробка різноманітних макетів та колажів</li>
                <li>Фотографії на документи</li>
            </ul>
            <p class="mb-4">Друк проводиться на професійному обладнанні фірми <strong>FUJI - цифровій фотолабораторії Frontier 500</strong>.</p>
            <p class="mb-4">Найвища якість ваших фотографій гарантована тим, що перед друком всі файли переглядаються оператором і в більшості випадків ми проводимо необхідну кольорову та тонову корекцію.</p>
            <div class="mt-8 pt-4 border-t border-gray-200">
                <p><strong>Адреса:</strong> м. Дніпро, вул. Європейська (Миронова), буд.8</p>
                <p><strong>Телефони:</strong> (099) 215-03-17, (098) 492-73-87</p>
                <p><strong>Час роботи:</strong> з 9:30 до 18:30 без вихідних</p>
            </div>
        `,
        en: `
            <h1 class="text-2xl font-bold text-[#009846] mb-4">FUJI-Mir</h1>
            <p class="mb-4"><strong>FUJI-Mir</strong> is one of the best enterprises providing digital photo printing services for both amateurs and professional photographers.</p>
            <p class="mb-4">You can order a range of design services from us, such as:</p>
            <ul class="list-disc pl-5 mb-4 space-y-1">
                <li>Scanning photos and films</li>
                <li>Restoration and computer processing of photos</li>
                <li>Red-eye removal</li>
                <li>Development of various layouts and collages</li>
                <li>ID photos</li>
            </ul>
            <p class="mb-4">Printing is done on professional equipment from <strong>FUJI - digital minilab Frontier 500</strong>.</p>
            <p class="mb-4">The highest quality of your photos is guaranteed because all files are reviewed by an operator before printing, and in most cases, we perform necessary color and tone corrections.</p>
            <div class="mt-8 pt-4 border-t border-gray-200">
                <p><strong>Address:</strong> Dnipro, Yevropeyska (Mironova) St, 8</p>
                <p><strong>Phones:</strong> (099) 215-03-17, (098) 492-73-87</p>
                <p><strong>Working Hours:</strong> 9:30 to 18:30 daily</p>
            </div>
        `
    };

    // Update About Page with new content
    const aboutPages = [
        { lang: 'ru', slug: 'about', title: 'О нас', description: 'О фотоцентре Fujimir', content: aboutContent.ru },
        { lang: 'uk', slug: 'about', title: 'Про нас', description: 'Про фотоцентр Fujimir', content: aboutContent.uk },
        { lang: 'en', slug: 'about', title: 'About Us', description: 'About Fujimir', content: aboutContent.en },

        {
            lang: 'ru', slug: 'contact', title: 'Контакты', description: 'Контакты Fujimir',
            content: `
                <h1 class="text-2xl font-bold text-[#009846] mb-4">Наши контакты</h1>
                <p class="mb-2"><strong>Адрес:</strong> г. Днепр, ул. Европейская (Миронова), д.8</p>
                <p class="mb-2"><strong>Время работы:</strong> с 9:30 до 18:30 без выходных</p>
                <div class="mt-4">
                    <p class="mb-1"><strong>Телефоны:</strong> (099) 215-03-17, (098) 492-73-87</p>
                    <p class="mb-1"><strong>Email:</strong> fujimir@ukr.net</p>
                </div>
            `
        },
        {
            lang: 'uk', slug: 'contact', title: 'Контакти', description: 'Контакти Fujimir',
            content: `
                <h1 class="text-2xl font-bold text-[#009846] mb-4">Наші контакти</h1>
                <p class="mb-2"><strong>Адреса:</strong> м. Дніпро, вул. Європейська (Миронова), буд.8</p>
                <p class="mb-2"><strong>Час роботи:</strong> з 9:30 до 18:30 без вихідних</p>
                <div class="mt-4">
                    <p class="mb-1"><strong>Телефони:</strong> (099) 215-03-17, (098) 492-73-87</p>
                    <p class="mb-1"><strong>Email:</strong> fujimir@ukr.net</p>
                </div>
            `
        },
        {
            lang: 'en', slug: 'contact', title: 'Contact', description: 'Contact Fujimir',
            content: `
                <h1 class="text-2xl font-bold text-[#009846] mb-4">Our Contacts</h1>
                <p class="mb-2"><strong>Address:</strong> Dnipro, Yevropeyska (Mironova) St, 8</p>
                <p class="mb-2"><strong>Working Hours:</strong> 9:30 to 18:30 daily</p>
                <div class="mt-4">
                    <p class="mb-1"><strong>Phones:</strong> (099) 215-03-17, (098) 492-73-87</p>
                    <p class="mb-1"><strong>Email:</strong> fujimir@ukr.net</p>
                </div>
            `
        },
    ];

    for (const p of aboutPages) {
        await prisma.page.upsert({
            where: { slug_lang: { slug: p.slug, lang: p.lang } },
            update: { ...p },
            create: { ...p }
        });
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
        <h3 class="text-lg font-bold mb-4">Почему фотография при печати обрезаются</h3>
        <p class="mb-4 text-sm">Изначально форматы печати рассчитывались под наиболее распространенные форматы кадров...</p>
        <p class="mb-4 text-sm">Подробнее: С появлением цифровых фотоаппаратов...</p>
        <div class="space-y-6">
            <div class="border rounded-lg overflow-hidden shadow-sm">
                 <div class="bg-gray-50 p-3 border-b text-center font-bold">Оригинал</div>
                 <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <img src="/images/help/orig.jpg" alt="Original" class="w-full mx-auto border" style="max-width: 240px;" />
                    <div class="text-sm">Снимок полученный с камеры 4:3 (цифромыльница).</div>
                 </div>
            </div>
             <div class="border rounded-lg overflow-hidden shadow-sm">
                 <div class="bg-gray-50 p-3 border-b text-center font-bold">Free Cropping</div>
                 <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <img src="/images/help/crop.jpg" alt="Crop" class="w-full mx-auto border" style="max-width: 240px;" />
                    <div class="text-sm">Произвольная обрезка оператором.</div>
                 </div>
            </div>
             <div class="border rounded-lg overflow-hidden shadow-sm">
                 <div class="bg-gray-50 p-3 border-b text-center font-bold">Fit-in</div>
                 <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <img src="/images/help/no_crop.jpg" alt="Fit" class="w-full mx-auto border" style="max-width: 240px;" />
                    <div class="text-sm">Печать целиком с белыми полями.</div>
                 </div>
            </div>
        </div>
    `;

    // -- UK Content
    const croppingContentUK = `
        <h3 class="text-lg font-bold mb-4">Чому фотографія при друку обрізається</h3>
        <p class="mb-4 text-sm">Спочатку формати друку розраховувалися під найбільш поширені формати кадрів...</p>
        <div class="space-y-6">
             <div class="border rounded-lg overflow-hidden shadow-sm">
                 <div class="bg-gray-50 p-3 border-b text-center font-bold">Оригінал</div>
                 <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <img src="/images/help/orig.jpg" alt="Original" class="w-full mx-auto border" style="max-width: 240px;" />
                    <div class="text-sm">Знімок отриманий з камери 4:3.</div>
                 </div>
            </div>
             <div class="border rounded-lg overflow-hidden shadow-sm">
                 <div class="bg-gray-50 p-3 border-b text-center font-bold">Free Cropping</div>
                 <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <img src="/images/help/crop.jpg" alt="Crop" class="w-full mx-auto border" style="max-width: 240px;" />
                    <div class="text-sm">Довільна обрізка оператором.</div>
                 </div>
            </div>
             <div class="border rounded-lg overflow-hidden shadow-sm">
                 <div class="bg-gray-50 p-3 border-b text-center font-bold">Fit-in</div>
                 <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <img src="/images/help/no_crop.jpg" alt="Fit" class="w-full mx-auto border" style="max-width: 240px;" />
                    <div class="text-sm">Друк цілком з білими полями.</div>
                 </div>
            </div>
        </div>
    `;

    // -- EN Content
    const croppingContentEN = `
        <h3 class="text-lg font-bold mb-4">Why photos are cropped when printed</h3>
        <p class="mb-4 text-sm">Initially, print formats were calculated for the most common frame formats...</p>
        <div class="space-y-6">
            <div class="border rounded-lg overflow-hidden shadow-sm">
                 <div class="bg-gray-50 p-3 border-b text-center font-bold">Original</div>
                 <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <img src="/images/help/orig.jpg" alt="Original" class="w-full mx-auto border" style="max-width: 240px;" />
                    <div class="text-sm">Original 4:3 image.</div>
                 </div>
            </div>
             <div class="border rounded-lg overflow-hidden shadow-sm">
                 <div class="bg-gray-50 p-3 border-b text-center font-bold">Free Cropping</div>
                 <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <img src="/images/help/crop.jpg" alt="Crop" class="w-full mx-auto border" style="max-width: 240px;" />
                    <div class="text-sm">Arbitrary cropping by operator.</div>
                 </div>
            </div>
             <div class="border rounded-lg overflow-hidden shadow-sm">
                 <div class="bg-gray-50 p-3 border-b text-center font-bold">Fit-in</div>
                 <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <img src="/images/help/no_crop.jpg" alt="Fit" class="w-full mx-auto border" style="max-width: 240px;" />
                    <div class="text-sm">Print whole image with white borders.</div>
                 </div>
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
                            <h3 class="text-lg font-bold mb-4">Наше оборудование и материалы</h3>
                            <div class="flex flex-col md:flex-row gap-6 items-start">
                                <img src="/images/help/frontier500.png" alt="Fujifilm Frontier 500" class="w-full md:w-1/3 rounded border shim" />
                                <div class="w-full md:w-2/3 text-sm">
                                    <p class="mb-4">Наша цифровая фотолаборатория — <strong>Fujifilm Frontier 500</strong>.</p>
                                    <ul class="list-disc pl-5 space-y-2 mb-4">
                                        <li>Система экспонирования: Лазерное экспонирование</li>
                                        <li>Производительность: 800 отп./час (10х15), макс. формат бумаги - 203 мм (А4)</li>
                                        <li>Автоматическая цветокоррекция, коррекция плотности, <strong>Image Intelligence™</strong></li>
                                    </ul>
                                    <p class="mb-2"><strong>Image Intelligence™</strong> - Технология автоматической коррекции снимков (осветление теней, коррекция скин-тонов), делающая фотографии более естественными.</p>
                                    <div class="mt-4 p-4 bg-blue-50 rounded border border-blue-100">
                                        <h4 class="font-bold mb-2">Бумага</h4>
                                        <p>Мы используем только оригинальную бумагу <strong>FUJICOLOR CRYSTAL ARCHIVE PAPER</strong>.</p>
                                    </div>
                                </div>
                            </div>
                        `
                    },
                    {
                        lang: 'uk',
                        title: 'Наше обладнання та матеріали',
                        content: `
                            <h3 class="text-lg font-bold mb-4">Наше обладнання та матеріали</h3>
                            <div class="flex flex-col md:flex-row gap-6 items-start">
                                <img src="/images/help/frontier500.png" alt="Fujifilm Frontier 500" class="w-full md:w-1/3 rounded border shim" />
                                <div class="w-full md:w-2/3 text-sm">
                                    <p class="mb-4">Наша цифрова фотолабораторія — <strong>Fujifilm Frontier 500</strong>.</p>
                                    <ul class="list-disc pl-5 space-y-2 mb-4">
                                        <li>Система експонування: Лазерне експонування</li>
                                        <li>Продуктивність: 800 відб./год (10х15), макс. формат паперу - 203 мм (А4)</li>
                                        <li>Автоматична корекція кольору, корекція щільності, <strong>Image Intelligence™</strong></li>
                                    </ul>
                                    <p class="mb-2"><strong>Image Intelligence™</strong> - Технологія автоматичної корекції знімків (освітлення тіней, корекція скін-тонів), що робить фотографії більш природними.</p>
                                    <div class="mt-4 p-4 bg-blue-50 rounded border border-blue-100">
                                        <h4 class="font-bold mb-2">Папір</h4>
                                        <p>Ми використовуємо тільки оригінальний папір <strong>FUJICOLOR CRYSTAL ARCHIVE PAPER</strong>.</p>
                                    </div>
                                </div>
                            </div>
                        `
                    },
                    {
                        lang: 'en',
                        title: 'Our Equipment and Materials',
                        content: `
                            <h3 class="text-lg font-bold mb-4">Our Equipment and Materials</h3>
                            <div class="flex flex-col md:flex-row gap-6 items-start">
                                <img src="/images/help/frontier500.png" alt="Fujifilm Frontier 500" class="w-full md:w-1/3 rounded border shim" />
                                <div class="w-full md:w-2/3 text-sm">
                                    <p class="mb-4">Our digital minilab is <strong>Fujifilm Frontier 500</strong>.</p>
                                    <ul class="list-disc pl-5 space-y-2 mb-4">
                                        <li>Exposure system: Laser exposure system</li>
                                        <li>Capacity: 800 prints/hr (10x15), max paper width - 203 mm (A4)</li>
                                        <li>Automatic color correction, density correction, <strong>Image Intelligence™</strong></li>
                                    </ul>
                                    <p class="mb-2"><strong>Image Intelligence™</strong> - Automatic image correction technology (shadow brightening, skin tone correction) that makes photos look more natural.</p>
                                    <div class="mt-4 p-4 bg-blue-50 rounded border border-blue-100">
                                        <h4 class="font-bold mb-2">Paper</h4>
                                        <p>We use only original <strong>FUJICOLOR CRYSTAL ARCHIVE PAPER</strong>.</p>
                                    </div>
                                </div>
                            </div>
                        `
                    }
                ]
            }
        } as any
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
