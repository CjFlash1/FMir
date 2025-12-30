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

    // 6. Translations (Extensive)
    const translations = [
        // Navigation
        { key: 'nav.upload', val: { uk: 'Завантажити фотографії', en: 'Upload Photos', ru: 'Закачать фотографии' } },
        { key: 'nav.pricing', val: { uk: 'Ціни', en: 'Pricing', ru: 'Цены' } },
        { key: 'nav.about', val: { uk: 'Про нас', en: 'About US', ru: 'О нас' } },
        { key: 'nav.contact', val: { uk: 'Контакти', en: 'Contact', ru: 'Контакты' } },
        { key: 'nav.help', val: { uk: 'Допомога', en: 'Help', ru: 'Помощь' } },
        { key: 'nav.signin', val: { uk: 'Увійти', en: 'Sign In', ru: 'Войти' } },

        // Upload Action Buttons
        { key: 'Select All', val: { uk: 'Обрати всі', en: 'Select All', ru: 'Выбрать все' } },
        { key: 'Deselect All', val: { uk: 'Зняти виділення', en: 'Deselect All', ru: 'Снять выделение' } },
        { key: 'Edit Selected', val: { uk: 'Редагувати обрані', en: 'Edit Selected', ru: 'Редактировать выбранные' } },
        { key: 'Duplicate Selected', val: { uk: 'Дублювати обрані', en: 'Duplicate Selected', ru: 'Дублировать выбранные' } },
        { key: 'Duplicate All', val: { uk: 'Дублювати всі', en: 'Duplicate All', ru: 'Дублировать все' } },

        // Checkout UI
        { key: 'checkout.summary', val: { uk: 'Підсумок замовлення', en: 'Order Summary', ru: 'Итог заказа' } },
        { key: 'checkout.total', val: { uk: 'Всього', en: 'Total', ru: 'Всего' } },
        { key: 'checkout.bonus', val: { uk: 'Бонус', en: 'Bonus', ru: 'Бонус' } },
        { key: 'checkout.free', val: { uk: 'Безкоштовно', en: 'Free', ru: 'Бесплатно' } },
        { key: 'checkout.placeOrder', val: { uk: 'Оформити замовлення', en: 'Place Order', ru: 'Оформить заказ' } },
        { key: 'common.processing', val: { uk: 'Обробка...', en: 'Processing...', ru: 'Обработка...' } },
        { key: 'checkout.firstname', val: { uk: 'Ім\'я', en: 'First Name', ru: 'Имя' } },
        { key: 'checkout.lastname', val: { uk: 'Прізвище', en: 'Last Name', ru: 'Фамилия' } },
        { key: 'checkout.fullname_hint', val: { uk: 'Для Нової Пошти вкажіть ім\'я та прізвище', en: 'For Nova Poshta please enter first and last name', ru: 'Для Новой Почты укажите имя и фамилию' } },

        // Options Labels
        { key: 'Border', val: { uk: 'З рамкою', en: 'White Border', ru: 'С рамкой' } },
        { key: 'Magnetic', val: { uk: 'Магніт', en: 'Magnetic', ru: 'Магнит' } },
        { key: 'Glossy', val: { uk: 'Глянцевий', en: 'Glossy', ru: 'Глянцевая' } },
        { key: 'Matte', val: { uk: 'Матовий', en: 'Matte', ru: 'Матовая' } },
        { key: 'prints', val: { uk: 'шт.', en: 'pcs.', ru: 'шт.' } },
        { key: 'pcs', val: { uk: 'шт', en: 'pcs', ru: 'шт' } },

        // Admin Sidebar
        { key: 'admin.dashboard', val: { uk: 'Панель', en: 'Dashboard', ru: 'Панель' } },
        { key: 'admin.orders', val: { uk: 'Замовлення', en: 'Orders', ru: 'Заказы' } },
        { key: 'admin.content', val: { uk: 'Медіа / Контент', en: 'Media / Content', ru: 'Медиа / Контент' } },
        { key: 'admin.users', val: { uk: 'Користувачі', en: 'Users', ru: 'Пользователи' } },
        { key: 'admin.pages', val: { uk: 'Сторінки CMS', en: 'CMS Pages', ru: 'Страницы CMS' } },
        { key: 'admin.translations', val: { uk: 'Переклади', en: 'Translations', ru: 'Переводы' } },
        { key: 'admin.settings', val: { uk: 'Налаштування', en: 'Global Settings', ru: 'Настройки' } },
        { key: 'admin.config', val: { uk: 'Конфігурація', en: 'System Config', ru: 'Конфигурация' } },

        // Order Statuses
        { key: 'admin.status.draft', val: { uk: 'Чернетка', en: 'Draft', ru: 'Черновик' } },
        { key: 'admin.status.pending', val: { uk: 'Новий', en: 'New', ru: 'Новый' } },
        { key: 'admin.status.processing', val: { uk: 'Виконується', en: 'Processing', ru: 'Выполняется' } },
        { key: 'admin.status.completed', val: { uk: 'Виконано', en: 'Completed', ru: 'Выполнен' } },
        { key: 'admin.status.cancelled', val: { uk: 'Скасовано', en: 'Cancelled', ru: 'Отменен' } },
        { key: 'admin.status_update_failed', val: { uk: 'Не вдалося оновити статус', en: 'Failed to update status', ru: 'Не удалось обновить статус' } },

        // Dashboard Statistics
        { key: 'admin.stats.pending', val: { uk: 'Нові замовлення', en: 'New Orders', ru: 'Новые заказы' } },
        { key: 'admin.stats.processing', val: { uk: 'В обробці', en: 'Processing', ru: 'В обработке' } },
        { key: 'admin.stats.completed', val: { uk: 'Виконано', en: 'Completed', ru: 'Выполнено' } },
        { key: 'admin.stats.draft', val: { uk: 'Чернетки', en: 'Drafts', ru: 'Черновики' } },
        { key: 'admin.stats.new_orders', val: { uk: 'Очікують обробки', en: 'Awaiting processing', ru: 'Ожидают обработки' } },
        { key: 'admin.stats.in_progress', val: { uk: 'Зараз виконуються', en: 'Currently in progress', ru: 'Сейчас выполняются' } },
        { key: 'admin.stats.done', val: { uk: 'Успішно завершені', en: 'Successfully completed', ru: 'Успешно завершены' } },
        { key: 'admin.stats.not_submitted', val: { uk: 'Не оформлені', en: 'Not submitted', ru: 'Не оформлены' } },
        { key: 'admin.stats.total_orders', val: { uk: 'Всього замовлень', en: 'Total Orders', ru: 'Всего заказов' } },
        { key: 'admin.stats.this_week', val: { uk: 'За тиждень', en: 'This Week', ru: 'За неделю' } },
        { key: 'admin.stats.revenue', val: { uk: 'Дохід', en: 'Revenue', ru: 'Доход' } },
        { key: 'admin.selected', val: { uk: 'Обрано', en: 'Selected', ru: 'Выбрано' } },
        { key: 'admin.showing', val: { uk: 'Показано', en: 'Showing', ru: 'Показано' } },
        { key: 'admin.of', val: { uk: 'з', en: 'of', ru: 'из' } },
        { key: 'admin.prev', val: { uk: 'Назад', en: 'Previous', ru: 'Назад' } },
        { key: 'admin.next', val: { uk: 'Далі', en: 'Next', ru: 'Далее' } },
        { key: 'bulk.delete', val: { uk: 'Видалити', en: 'Delete', ru: 'Удалить' } },
        { key: 'admin.stats.storage_used', val: { uk: 'Зайнято місця', en: 'Storage Used', ru: 'Занято места' } },
        { key: 'admin.size', val: { uk: 'Розмір', en: 'Size', ru: 'Размер' } },
        { key: 'admin.create_ttn', val: { uk: 'Створити ТТН', en: 'Create TTN', ru: 'Создать ТТН' } },
        { key: 'np.city', val: { uk: 'Місто', en: 'City', ru: 'Город' } },
        { key: 'np.warehouse', val: { uk: 'Відділення', en: 'Warehouse', ru: 'Отделение' } },
        { key: 'np.city_placeholder', val: { uk: 'Почніть вводити назву міста...', en: 'Start typing city name...', ru: 'Начните вводить название города...' } },
        { key: 'np.warehouse_placeholder', val: { uk: 'Пошук відділення за номером або адресою...', en: 'Search branch by number or address...', ru: 'Поиск отделения по номеру или адресу...' } },
        { key: 'np.no_results', val: { uk: 'Нічого не знайдено', en: 'No results found', ru: 'Ничего не найдено' } },

        // Config Submenu
        { key: 'config.sizes', val: { uk: 'Розміри', en: 'Print Sizes', ru: 'Размеры' } },
        { key: 'config.papers', val: { uk: 'Типи паперу', en: 'Paper Types', ru: 'Типы бумаги' } },
        { key: 'config.options', val: { uk: 'Опції', en: 'Extra Options', ru: 'Опции' } },
        { key: 'config.gifts', val: { uk: 'Подарунки', en: 'Gifts', ru: 'Подарки' } },
        { key: 'config.discounts', val: { uk: 'Розміри та знижки', en: 'Sizes & Discounts', ru: 'Размеры и скидки' } },
        { key: 'config.pricing_table', val: { uk: 'Таблиця цін', en: 'Pricing Table', ru: 'Таблица цен' } },
        { key: 'config.add_size', val: { uk: 'Додати розмір', en: 'Add Size', ru: 'Добавить размер' } },
        { key: 'config.size_name', val: { uk: 'Назва розміру', en: 'Size Name', ru: 'Название размера' } },
        { key: 'config.base_price', val: { uk: 'Базова ціна', en: 'Base Price', ru: 'Базовая цена' } },
        { key: 'config.no_sizes', val: { uk: 'Розміри не додані', en: 'No sizes added', ru: 'Размеры не добавлены' } },
        { key: 'config.drag_to_sort', val: { uk: 'Перетягніть рядки для зміни порядку', en: 'Drag rows to reorder', ru: 'Перетащите строки для изменения порядка' } },
        { key: 'admin.add', val: { uk: 'Додати', en: 'Add', ru: 'Добавить' } },
        { key: 'admin.save_all', val: { uk: 'Зберегти все', en: 'Save All', ru: 'Сохранить все' } },
        { key: 'admin.confirm_delete', val: { uk: 'Ви впевнені, що хочете видалити?', en: 'Are you sure you want to delete?', ru: 'Вы уверены, что хотите удалить?' } },
        { key: 'config.add_tier', val: { uk: 'Додати поріг', en: 'Add Tier', ru: 'Добавить порог' } },
        { key: 'config.tier_label', val: { uk: 'Назва', en: 'Label', ru: 'Название' } },
        { key: 'config.min_qty', val: { uk: 'Від шт.', en: 'From qty', ru: 'От шт.' } },

        // Misc
        { key: 'upload.default_notice', val: { uk: 'За замовчуванням: 10x15, Глянцевий', en: 'Default: 10x15, Glossy', ru: 'По умолчанию: 10x15, Глянцевая' } },
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

        // Modal / UI
        { key: 'Print Settings', val: { uk: 'Налаштування друку', en: 'Print Settings', ru: 'Настройки печати' } },
        { key: 'Size', val: { uk: 'Розмір', en: 'Size', ru: 'Размер' } },
        { key: 'Paper Type', val: { uk: 'Тип паперу', en: 'Paper Type', ru: 'Тип бумаги' } },
        { key: 'Quantity', val: { uk: 'Кількість', en: 'Quantity', ru: 'Количество' } },
        { key: 'Extras', val: { uk: 'Додатково', en: 'Extras', ru: 'Дополнительно' } },
        { key: 'badge.mag', val: { uk: 'Маг', en: 'Mag', ru: 'Маг' } },
        { key: 'badge.border', val: { uk: 'Рам', en: 'Bord', ru: 'Рам' } },
        { key: 'bulk.delete', val: { uk: 'Видалити', en: 'Delete', ru: 'Удалить' } },
        { key: 'bulk.add', val: { uk: 'Додати', en: 'Add', ru: 'Добавить' } },
        { key: 'upload.all_default_notice', val: { uk: 'Увага! Всі завантажені фото: 10x15 Глянцевий (якщо не змінено)', en: 'Note: All uploaded photos are 10x15 Glossy (unless changed)', ru: 'Внимание! Все загруженные фото: 10x15 Глянцевая (если не изменено)' } },
        { key: 'Cancel', val: { uk: 'Скасувати', en: 'Cancel', ru: 'Отмена' } },
        { key: 'Save Changes', val: { uk: 'Зберегти зміни', en: 'Save Changes', ru: 'Сохранить изменения' } },
        { key: 'Loading...', val: { uk: 'Завантаження...', en: 'Loading...', ru: 'Загрузка...' } },
        { key: 'Option', val: { uk: 'Опція', en: 'Option', ru: 'Опция' } },
        { key: 'Price', val: { uk: 'Ціна', en: 'Price', ru: 'Цена' } },
        { key: 'Extra Options', val: { uk: 'Додаткові опції', en: 'Extra Options', ru: 'Дополнительные опции' } },

        // Checkout Extended
        { key: 'checkout.shipping_contact', val: { uk: 'Доставка та Контакти', en: 'Shipping & Contact', ru: 'Доставка и Контакты' } },
        { key: 'checkout.name', val: { uk: 'ПІБ', en: 'Full Name', ru: 'ФИО' } },
        { key: 'checkout.phone', val: { uk: 'Телефон', en: 'Phone Number', ru: 'Телефон' } },
        { key: 'checkout.email', val: { uk: 'Email (необов\'язково)', en: 'Email Address (Optional)', ru: 'Email (необязательно)' } },
        { key: 'checkout.delivery_method', val: { uk: 'Спосіб доставки', en: 'Delivery Method', ru: 'Способ доставки' } },
        { key: 'checkout.pickup', val: { uk: 'Самовивіз', en: 'Pickup', ru: 'Самовывоз' } },
        { key: 'checkout.novaposhta', val: { uk: 'Нова Пошта', en: 'Nova Poshta', ru: 'Новая Почта' } },
        { key: 'checkout.local', val: { uk: 'Місцева доставка', en: 'Local Delivery', ru: 'Местная доставка' } },
        { key: 'checkout.address_branch', val: { uk: 'Адреса доставки / № Відділення', en: 'Delivery Address / Branch #', ru: 'Адрес доставки / № Отделения' } },
        { key: 'checkout.empty', val: { uk: 'Ваш кошик порожній.', en: 'Your cart is empty.', ru: 'Ваша корзина пуста.' } },
        { key: 'checkout.back', val: { uk: 'Назад до завантаження', en: 'Back to Upload', ru: 'Назад к загрузке' } },
        { key: 'checkout.order_confirmed', val: { uk: 'Замовлення підтверджено!', en: 'Order Confirmed!', ru: 'Заказ подтвержден!' } },
        { key: 'checkout.return_home', val: { uk: 'На головну', en: 'Return Home', ru: 'На главную' } },
        { key: 'Saved', val: { uk: 'Економія', en: 'Saved', ru: 'Экономия' } },

        // Nova Poshta
        { key: 'np.city', val: { uk: 'Місто', en: 'City', ru: 'Город' } },
        { key: 'np.city_placeholder', val: { uk: 'Введіть назву міста...', en: 'Enter city name...', ru: 'Введите название города...' } },
        { key: 'np.warehouse', val: { uk: 'Відділення / Поштомат', en: 'Branch / Postamat', ru: 'Отделение / Почтомат' } },
        { key: 'np.warehouse_placeholder', val: { uk: 'Пошук відділення або поштомату...', en: 'Search branch or postamat...', ru: 'Поиск отделения или почтомата...' } },
        { key: 'np.no_results', val: { uk: 'Нічого не знайдено', en: 'No results found', ru: 'Ничего не найдено' } },
        { key: 'checkout.delivery_address', val: { uk: 'Адреса доставки', en: 'Delivery Address', ru: 'Адрес доставки' } },

        // Admin
        { key: 'admin.dashboard', val: { uk: 'Панель', en: 'Dashboard', ru: 'Панель' } },
        { key: 'admin.orders', val: { uk: 'Замовлення', en: 'Orders', ru: 'Заказы' } },
        { key: 'admin.content', val: { uk: 'Контент', en: 'Content', ru: 'Контент' } },
        { key: 'admin.users', val: { uk: 'Користувачі', en: 'Users', ru: 'Пользователи' } },
        { key: 'admin.help', val: { uk: 'Допомога', en: 'Help', ru: 'Помощь' } },
        { key: 'admin.pages', val: { uk: 'Сторінки', en: 'Pages', ru: 'Страницы' } },
        { key: 'admin.translations', val: { uk: 'Переклади', en: 'Translations', ru: 'Переводы' } },
        { key: 'admin.settings', val: { uk: 'Налаштування', en: 'Settings', ru: 'Настройки' } },
        { key: 'admin.config', val: { uk: 'Конфігурація', en: 'Config', ru: 'Конфигурация' } },
        { key: 'admin.order_number', val: { uk: '№ Замовлення', en: 'Order #', ru: '№ Заказа' } },
        { key: 'admin.date', val: { uk: 'Дата', en: 'Date', ru: 'Дата' } },
        { key: 'admin.customer', val: { uk: 'Клієнт', en: 'Customer', ru: 'Клиент' } },
        { key: 'admin.method', val: { uk: 'Метод', en: 'Method', ru: 'Метод' } },
        { key: 'admin.items', val: { uk: 'Позиції', en: 'Items', ru: 'Позиции' } },
        { key: 'admin.total', val: { uk: 'Разом', en: 'Total', ru: 'Итого' } },
        { key: 'admin.status', val: { uk: 'Статус', en: 'Status', ru: 'Статус' } },
        { key: 'admin.action', val: { uk: 'Дія', en: 'Action', ru: 'Действие' } },
        { key: 'admin.view', val: { uk: 'Перегляд', en: 'View', ru: 'Просмотр' } },
        { key: 'admin.back_to_orders', val: { uk: 'Назад до замовлень', en: 'Back to Orders', ru: 'Назад к заказам' } },
        { key: 'admin.customer_info', val: { uk: 'Інформація про клієнта', en: 'Customer Info', ru: 'Информация о клиенте' } },
        { key: 'admin.shipping_details', val: { uk: 'Деталі доставки', en: 'Shipping Details', ru: 'Детали доставки' } },
        { key: 'admin.preview', val: { uk: 'Превʼю', en: 'Preview', ru: 'Превью' } },
        { key: 'admin.file_info', val: { uk: 'Інфо файлу', en: 'File Info', ru: 'Инфо файла' } },
        { key: 'admin.print_options', val: { uk: 'Параметри друку', en: 'Print Options', ru: 'Параметры печати' } },
        { key: 'admin.download', val: { uk: 'Завантажити', en: 'Download', ru: 'Скачать' } },
        { key: 'admin.unknown', val: { uk: 'Невідомо', en: 'Unknown', ru: 'Неизвестно' } },
        { key: 'item_short', val: { uk: 'шт', en: 'item', ru: 'шт' } },
        { key: 'Download Archive', val: { uk: 'Завантажити архів', en: 'Download Archive', ru: 'Скачать архив' } },
        { key: 'Delete Order', val: { uk: 'Видалити замовлення', en: 'Delete Order', ru: 'Удалить заказ' } },
        { key: 'Are you sure you want to delete this order? This action cannot be undone.', val: { uk: 'Ви впевнені, що хочете видалити це замовлення? Цю дію неможливо відмінити.', en: 'Are you sure you want to delete this order? This action cannot be undone.', ru: 'Вы уверены, что хотите удалить этот заказ? Это действие невозможно отменить.' } },
        { key: 'No orders found', val: { uk: 'Замовлень не знайдено', en: 'No orders found', ru: 'Заказов не найдено' } },
        { key: 'Are you sure you want to delete selected orders?', val: { uk: 'Ви впевнені, що хочете видалити обрані замовлення?', en: 'Are you sure you want to delete selected orders?', ru: 'Вы уверены, что хотите удалить выбранные заказы?' } },
        { key: 'checkout.phone_error', val: { uk: 'Будь ласка, введіть коректний номер телефону (мінімум 10 цифр)', en: 'Please enter a valid phone number (at least 10 digits)', ru: 'Пожалуйста, введите корректный номер телефона (минимум 10 цифр)' } },
        { key: 'admin.phone', val: { uk: 'Телефон', en: 'Phone', ru: 'Телефон' } },
        { key: 'admin.email', val: { uk: 'Email', en: 'Email', ru: 'Email' } },
        { key: 'admin.address_branch', val: { uk: 'Адреса / Відділення', en: 'Address / Branch', ru: 'Адрес / Отделение' } },
        { key: 'admin.deleting', val: { uk: 'Видалення...', en: 'Deleting...', ru: 'Удаление...' } },
        { key: 'PENDING', val: { uk: 'Очікує', en: 'Pending', ru: 'Ожидает' } },
        { key: 'PROCESSING', val: { uk: 'В обробці', en: 'Processing', ru: 'В обработке' } },
        { key: 'COMPLETED', val: { uk: 'Виконано', en: 'Completed', ru: 'Выполнено' } },
        { key: 'COMPLETED', val: { uk: 'Виконано', en: 'Completed', ru: 'Выполнено' } },
        { key: 'CANCELLED', val: { uk: 'Скасовано', en: 'Cancelled', ru: 'Отменено' } },
        { key: 'admin.signout', val: { uk: 'Вихід / На сайт', en: 'Sign Out / Main Site', ru: 'Выход / На сайт' } },
        { key: 'admin.settings', val: { uk: 'Налаштування', en: 'Settings', ru: 'Настройки' } },
        { key: 'settings.general', val: { uk: 'Загальна інформація', en: 'General Information', ru: 'Общая информация' } },
        { key: 'settings.general_desc', val: { uk: 'Базові налаштування сайту та метадані.', en: 'Basic site configuration and metadata.', ru: 'Базовая конфигурация сайта и метаданные.' } },
        { key: 'settings.site_name', val: { uk: 'Назва сайту', en: 'Site Name', ru: 'Название сайта' } },
        { key: 'settings.support_email', val: { uk: 'Email підтримки', en: 'Support Email', ru: 'Email поддержки' } },
        { key: 'settings.contact_phone', val: { uk: 'Контактний телефон', en: 'Contact Phone', ru: 'Контактный телефон' } },
        { key: 'settings.social', val: { uk: 'Соціальні мережі', en: 'Social Links', ru: 'Социальные сети' } },
        { key: 'settings.social_desc', val: { uk: 'Посилання на ваші профілі.', en: 'Links to your social media profiles.', ru: 'Ссылки на ваши профили.' } },
        { key: 'settings.instagram', val: { uk: 'Instagram URL', en: 'Instagram URL', ru: 'Instagram URL' } },
        { key: 'settings.facebook', val: { uk: 'Facebook URL', en: 'Facebook URL', ru: 'Facebook URL' } },
        { key: 'settings.messengers', val: { uk: 'Месенджери', en: 'Messengers', ru: 'Мессенджеры' } },
        { key: 'settings.messengers_desc', val: { uk: 'Налаштування кнопок швидкого зв\'язку.', en: 'Configure floating contact buttons.', ru: 'Настройка кнопок быстрой связи.' } },
        { key: 'settings.viber', val: { uk: 'Viber (посилання/номер)', en: 'Viber Link/Number', ru: 'Viber (ссылка/номер)' } },
        { key: 'settings.telegram', val: { uk: 'Telegram (логін/посилання)', en: 'Telegram Username/Link', ru: 'Telegram (логин/ссылка)' } },
        { key: 'settings.viber_active', val: { uk: 'Увімкнути Viber (true/false)', en: 'Enable Viber (true/false)', ru: 'Включить Viber (true/false)' } },
        { key: 'settings.telegram_active', val: { uk: 'Увімкнути Telegram (true/false)', en: 'Enable Telegram (true/false)', ru: 'Включить Telegram (true/false)' } },

        { key: 'config.system_title', val: { uk: 'Конфігурація Системи', en: 'System Configuration', ru: 'Конфигурация Системы' } },
        { key: 'settings.contact_phone1', val: { uk: 'Телефон 1', en: 'Phone 1', ru: 'Телефон 1' } },
        { key: 'settings.contact_phone2', val: { uk: 'Телефон 2', en: 'Phone 2', ru: 'Телефон 2' } },
        { key: 'settings.contact_address', val: { uk: 'Адреса (текст шапки)', en: 'Address (Header Text)', ru: 'Адрес (текст шапки)' } },
        { key: 'settings.contact_schedule', val: { uk: 'Графік роботи', en: 'Schedule', ru: 'График работы' } },
        { key: 'header.schedule_default', val: { uk: 'Пн-Сб 9:30-18:30 (Нд - вихідний)', en: 'Mon-Sat 9:30-18:30 (Sun closed)', ru: 'Пн-Сб 9:30-18:30 (Вс - выходной)' } },
        { key: 'general.currency', val: { uk: 'ГРН', en: 'UAH', ru: 'ГРН' } },

        // SEO - Home page "How it works" section
        { key: 'Як замовити друк фотографій онлайн', val: { uk: 'Як замовити друк фотографій онлайн', en: 'How to order photo printing online', ru: 'Как заказать печать фотографий онлайн' } },
        { key: 'Завантажте фотографії', val: { uk: 'Завантажте фотографії', en: 'Upload your photos', ru: 'Загрузите фотографии' } },
        {
            key: 'Для того, щоб зробити замовлення фотографій онлайн, завантажте їх на наш сайт. Файли приймаються у форматі JPG, PNG та інших популярних форматах. Максимальний розмір одного файлу — 100 MB.', val: {
                uk: 'Для того, щоб зробити замовлення фотографій онлайн, завантажте їх на наш сайт. Файли приймаються у форматі JPG, PNG та інших популярних форматах. Максимальний розмір одного файлу — 100 MB.',
                en: 'To place an order for photos online, upload them to our website. Files are accepted in JPG, PNG and other popular formats. Maximum file size — 100 MB.',
                ru: 'Для того, чтобы сделать заказ фотографий онлайн, загрузите их на наш сайт. Файлы принимаются в формате JPG, PNG и других популярных форматах. Максимальный размер одного файла — 100 MB.'
            }
        },
        { key: 'Оформіть замовлення', val: { uk: 'Оформіть замовлення', en: 'Place your order', ru: 'Оформите заказ' } },
        {
            key: 'Після того як фотографії завантажені, оберіть розмір, кількість та інші параметри. При друку великої кількості фотографій надається знижка. При замовленні від 1200 грн — магніт або безкоштовна доставка у подарунок!', val: {
                uk: 'Після того як фотографії завантажені, оберіть розмір, кількість та інші параметри. При друку великої кількості фотографій надається знижка. При замовленні від 1200 грн — магніт або безкоштовна доставка у подарунок!',
                en: 'After uploading photos, choose size, quantity and other options. Bulk discounts available for large orders. Orders over 1200 UAH get a free magnet or free delivery!',
                ru: 'После того как фотографии загружены, выберите размер, количество и другие параметры. При печати большого количества фотографий предоставляется скидка. При заказе от 1200 грн — магнит или бесплатная доставка в подарок!'
            }
        },
        { key: 'Отримайте фотографії', val: { uk: 'Отримайте фотографії', en: 'Receive your photos', ru: 'Получите фотографии' } },
        {
            key: 'Фотографії ви можете забрати самостійно за адресою вул. Європейська, 8, або замовити доставку кур\'єром по м. Дніпро чи у будь-яке місто України службою доставки «Нова Пошта».', val: {
                uk: 'Фотографії ви можете забрати самостійно за адресою вул. Європейська, 8, або замовити доставку кур\'єром по м. Дніпро чи у будь-яке місто України службою доставки «Нова Пошта».',
                en: 'You can pick up your photos at 8 Yevropeyska St, or order courier delivery in Dnipro or to any city in Ukraine via Nova Poshta.',
                ru: 'Фотографии вы можете забрать самостоятельно по адресу ул. Европейская, 8, или заказать доставку курьером по г. Днепр или в любой город Украины службой доставки «Новая почта».'
            }
        },

        // SEO - Home page bottom text section
        { key: 'Послуги цифрового фотодруку через інтернет у м. Дніпро', val: { uk: 'Послуги цифрового фотодруку через інтернет у м. Дніпро', en: 'Digital photo printing services online in Dnipro', ru: 'Услуги цифровой фотопечати через интернет в г. Днепр' } },
        {
            key: 'Як ви думаєте, для чого потрібні фотографії? Фотографії потрібні для того, щоб зафіксувати унікальні моменти життя, які, можливо, ніколи не повторяться!', val: {
                uk: 'Як ви думаєте, для чого потрібні фотографії? Фотографії потрібні для того, щоб зафіксувати унікальні моменти життя, які, можливо, ніколи не повторяться!',
                en: 'What do you think photographs are for? Photographs are needed to capture unique moments in life that may never happen again!',
                ru: 'Как вы думаете, для чего нужны фотографии? Фотографии нужны для того чтобы зафиксировать уникальные моменты жизни, которые возможно ни разу не повторятся!'
            }
        },
        {
            key: 'Саме це і пропонує своїм клієнтам служба друку фотографій онлайн «FUJI-Світ» — друк фотографій у Дніпрі. Ви скажете, що друк фото у Дніпрі пропонують багато хто, і, звісно ж, маєте рацію! Але відчути себе на крок попереду всіх, скориставшись послугою друку фотографій через інтернет у Дніпрі, допоможемо вам саме ми!', val: {
                uk: 'Саме це і пропонує своїм клієнтам служба друку фотографій онлайн «FUJI-Світ» — друк фотографій у Дніпрі. Ви скажете, що друк фото у Дніпрі пропонують багато хто, і, звісно ж, маєте рацію! Але відчути себе на крок попереду всіх, скориставшись послугою друку фотографій через інтернет у Дніпрі, допоможемо вам саме ми!',
                en: 'This is exactly what the FUJI-Svit online photo printing service offers its customers — photo printing in Dnipro. You may say that many offer photo printing in Dnipro, and you are absolutely right! But we will help you feel one step ahead of everyone by using our online photo printing service in Dnipro!',
                ru: 'Именно это и предлагает своим клиентам служба печати фотографий онлайн «FUJI-Мир» — печать фотографий в Днепре. Вы скажете, что печать фото в Днепре предлагают многие, и, конечно же, правы! Но почувствовать себя на шаг впереди всех, воспользовавшись услугой печати фотографий через интернет в Днепре, поможем вам именно мы!'
            }
        },
        { key: 'У нас ви можете замовити ряд дизайнерських послуг таких як:', val: { uk: 'У нас ви можете замовити ряд дизайнерських послуг таких як:', en: 'You can order a range of design services from us, such as:', ru: 'У нас вы можете заказать ряд дизайнерских услуг таких как:' } },
        { key: 'сканування фотографій та плівок', val: { uk: 'сканування фотографій та плівок', en: 'scanning of photos and films', ru: 'сканирование фотографий и пленок' } },
        { key: 'реставрація та комп\'ютерна обробка фотографій', val: { uk: 'реставрація та комп\'ютерна обробка фотографій', en: 'restoration and computer processing of photos', ru: 'реставрация и компьютерная обработка фотографий' } },
        { key: 'усунення ефекту червоних очей', val: { uk: 'усунення ефекту червоних очей', en: 'red-eye removal', ru: 'устранение эффекта красных глаз' } },
        { key: 'розробка різноманітних макетів та колажів', val: { uk: 'розробка різноманітних макетів та колажів', en: 'development of various layouts and collages', ru: 'разработка различных макетов и коллажей' } },
        { key: 'а також зробити фотографію на документи', val: { uk: 'а також зробити фотографію на документи', en: 'as well as passport/ID photos', ru: 'а так же сделать фотографию на документы' } },
        { key: 'продаж фотоплівки та проявка плівок', val: { uk: 'продаж фотоплівки та проявка плівок', en: 'photo film sales and film development', ru: 'продажа фотопленки и проявка пленок' } },
        { key: 'продаж фоторамок різних розмірів', val: { uk: 'продаж фоторамок різних розмірів', en: 'photo frames of various sizes', ru: 'продажа фоторамок разных размеров' } },
        { key: 'Наш сервіс для тих людей, хто цінує свій час та гроші!', val: { uk: 'Наш сервіс для тих людей, хто цінує свій час та гроші!', en: 'Our service is for people who value their time and money!', ru: 'Наш сервис для тех людей кто ценит свое время и деньги!' } },

        // SEO - Pagination buttons
        { key: 'Показати ще', val: { uk: 'Показати ще', en: 'Show more', ru: 'Показать ещё' } },
        { key: 'фото', val: { uk: 'фото', en: 'photos', ru: 'фото' } },
        { key: 'Показано', val: { uk: 'Показано', en: 'Showing', ru: 'Показано' } },
        { key: 'з', val: { uk: 'з', en: 'of', ru: 'из' } },

        // SEO Settings labels
        { key: 'settings.seo', val: { uk: 'SEO Налаштування', en: 'SEO Settings', ru: 'SEO Настройки' } },
        { key: 'settings.seo_desc', val: { uk: 'Коди верифікації для пошукових систем', en: 'Verification codes for search engines', ru: 'Коды верификации для поисковых систем' } },
        { key: 'settings.google_verification', val: { uk: 'Google Search Console', en: 'Google Search Console', ru: 'Google Search Console' } },
        { key: 'settings.yandex_verification', val: { uk: 'Яндекс Вебмастер', en: 'Yandex Webmaster', ru: 'Яндекс Вебмастер' } },
        { key: 'settings.bing_verification', val: { uk: 'Bing Webmaster', en: 'Bing Webmaster', ru: 'Bing Webmaster' } },

        // Gift system translations
        {
            key: 'gift.step2_desc', val: {
                uk: 'Після того як фотографії завантажені, оберіть розмір, кількість та інші параметри. При друку великої кількості фотографій надається знижка.',
                en: 'After uploading photos, choose size, quantity and other options. Bulk discounts available.',
                ru: 'После того как фотографии загружены, выберите размер, количество и другие параметры. При печати большого количества фотографий предоставляется скидка.'
            }
        },
        {
            key: 'gift.promo_text', val: {
                uk: 'При замовленні від {amount} грн — магніт або безкоштовна доставка у подарунок!',
                en: 'Orders over {amount} UAH get a free magnet or free delivery!',
                ru: 'При заказе от {amount} грн — магнит или бесплатная доставка в подарок!'
            }
        },
        { key: 'gift.title', val: { uk: '🎁 Вам доступний подарунок!', en: '🎁 You qualify for a gift!', ru: '🎁 Вам доступен подарок!' } },
        { key: 'gift.choose', val: { uk: 'Оберіть ваш подарунок:', en: 'Choose your gift:', ru: 'Выберите ваш подарок:' } },
        { key: 'gift.free_delivery', val: { uk: '🚚 Безкоштовна доставка', en: '🚚 Free Delivery', ru: '🚚 Бесплатная доставка' } },
        { key: 'gift.free_magnet', val: { uk: '🧲 Безкоштовний магніт 10x15', en: '🧲 Free 10x15 Magnet', ru: '🧲 Бесплатный магнит 10x15' } },
        { key: 'gift.magnet_upload', val: { uk: 'Завантажити нове фото', en: 'Upload new photo', ru: 'Загрузить новое фото' } },
        { key: 'gift.magnet_existing', val: { uk: 'Обрати з завантажених', en: 'Choose from uploaded', ru: 'Выбрать из загруженных' } },
        { key: 'gift.magnet_comment', val: { uk: 'Залишити коментар', en: 'Leave a comment', ru: 'Оставить комментарий' } },
        { key: 'gift.magnet_photo_placeholder', val: { uk: 'Наприклад: "Фото №5" або опис побажань', en: 'E.g.: "Photo #5" or describe your wishes', ru: 'Например: "Фото №5" или опишите пожелания' } },
        { key: 'gift.selected', val: { uk: 'Обраний подарунок', en: 'Selected gift', ru: 'Выбранный подарок' } },
        { key: 'gift.select_photo', val: { uk: 'Оберіть фото', en: 'Select photo', ru: 'Выберите фото' } },
        { key: 'Photo', val: { uk: 'Фото', en: 'Photo', ru: 'Фото' } },
        { key: 'and_more', val: { uk: 'та ще', en: 'and more', ru: 'и ещё' } },
        { key: 'validation.required_field', val: { uk: 'Заповніть це поле', en: 'Please fill in this field', ru: 'Заполните это поле' } },
        { key: 'gift.select_required', val: { uk: 'Оберіть ваш подарунок', en: 'Please select your gift', ru: 'Выберите ваш подарок' } },

        // Pricing page translations
        { key: 'pricing.title', val: { uk: 'Ціни та послуги', en: 'Prices & Services', ru: 'Цены и услуги' } },
        { key: 'pricing.subtitle', val: { uk: 'Прозорі ціни без прихованих комісій', en: 'Transparent pricing with no hidden fees', ru: 'Прозрачные цены без скрытых комиссий' } },
        { key: 'pricing.photo_print', val: { uk: 'Фотодрук', en: 'Photo Printing', ru: 'Фотопечать' } },
        { key: 'pricing.magnets', val: { uk: 'Магніти на холодильник', en: 'Fridge Magnets', ru: 'Магниты на холодильник' } },
        { key: 'pricing.delivery', val: { uk: 'Доставка', en: 'Delivery', ru: 'Доставка' } },
        { key: 'pricing.services', val: { uk: 'Додаткові послуги', en: 'Additional Services', ru: 'Дополнительные услуги' } },
        { key: 'pricing.format', val: { uk: 'Формат', en: 'Format', ru: 'Формат' } },
        { key: 'pricing.price', val: { uk: 'Ціна', en: 'Price', ru: 'Цена' } },
        { key: 'pricing.currency_note', val: { uk: 'Ціни вказані в гривнях за 1 фото', en: 'Prices in UAH per photo', ru: 'Цены указаны в гривнах за 1 фото' } },
        { key: 'pricing.magnet_note', val: { uk: 'Фотомагніт — це повна вартість (фото + магнітна основа)', en: 'Magnet price includes photo + magnetic base', ru: 'Магнит — это полная стоимость (фото + магнитная основа)' } },
        { key: 'pricing.by_tariff', val: { uk: 'за тарифами', en: 'by tariff', ru: 'по тарифам' } },
        { key: 'pricing.service_scan', val: { uk: 'Сканування фотографій та плівок', en: 'Photo and film scanning', ru: 'Сканирование фотографий и плёнок' } },
        { key: 'pricing.service_restore', val: { uk: 'Реставрація та обробка фотографій', en: 'Photo restoration and editing', ru: 'Реставрация и обработка фотографий' } },
        { key: 'pricing.service_redeye', val: { uk: 'Усунення ефекту червоних очей', en: 'Red-eye removal', ru: 'Устранение эффекта красных глаз' } },
        { key: 'pricing.service_collage', val: { uk: 'Розробка макетів та колажів', en: 'Layout and collage design', ru: 'Разработка макетов и коллажей' } },
        { key: 'pricing.service_documents', val: { uk: 'Фото на документи', en: 'ID photos', ru: 'Фото на документы' } },
        { key: 'pricing.contact_for_services', val: { uk: 'Зв\'яжіться з нами для уточнення вартості', en: 'Contact us for pricing details', ru: 'Свяжитесь с нами для уточнения стоимости' } },
        { key: 'pricing.promo_title', val: { uk: '🎁 Спеціальна пропозиція', en: '🎁 Special Offer', ru: '🎁 Специальное предложение' } },
        { key: 'pricing.promo_desc', val: { uk: 'При замовленні від 1200 грн — безкоштовний магніт або безкоштовна доставка у подарунок!', en: 'Orders over 1200 UAH get a free magnet or free delivery!', ru: 'При заказе от 1200 грн — бесплатный магнит или бесплатная доставка в подарок!' } },

        // Admin config translations
        { key: 'config.magnets', val: { uk: 'Магніти', en: 'Magnets', ru: 'Магниты' } },
        { key: 'config.magnets_desc', val: { uk: 'Управління цінами на фотомагніти', en: 'Manage photo magnet pricing', ru: 'Управление ценами на фотомагниты' } },
        { key: 'config.delivery', val: { uk: 'Доставка', en: 'Delivery', ru: 'Доставка' } },
        { key: 'config.delivery_desc', val: { uk: 'Управління опціями та цінами на доставку', en: 'Manage delivery options and pricing', ru: 'Управление опциями и ценами на доставку' } },

        // Image Options (New)
        { key: 'image_options.additional', val: { uk: 'Додатково (Обрізка)', en: 'Additional (Cropping)', ru: 'Дополнительно' } },
        { key: 'image_options.free_cropping', val: { uk: 'Free Cropping (Вільна обрізка)', en: 'Free Cropping (Standard)', ru: 'Free Cropping (Произвольная обрезка)' } },
        { key: 'image_options.fit_in', val: { uk: 'Не обрізати (FIT-IN)', en: 'FIT-IN (No Crop)', ru: 'Не обрезать (FIT-IN)' } },
        { key: 'image_options.no_resize', val: { uk: 'Без масштабування (NO-RESIZE)', en: 'NO-RESIZE', ru: 'Без масштабирования (NO-RESIZE)' } },
        { key: 'image_options.crop_std_default', val: { uk: '', en: '', ru: '' } }, // Empty default

        // ===== NEW TRANSLATIONS (Admin Actions) =====
        { key: 'admin.status_updated', val: { uk: 'Статус оновлено', en: 'Status updated', ru: 'Статус обновлен' } },
        { key: 'admin.order_deleted', val: { uk: 'Замовлення видалено', en: 'Order deleted', ru: 'Заказ удален' } },
        { key: 'admin.orders_deleted', val: { uk: 'Замовлення видалено', en: 'Orders deleted', ru: 'Заказы удалены' } },
        { key: 'admin.delivery_carrier', val: { uk: 'За тарифами перевізника', en: 'By carrier tariffs', ru: 'По тарифам перевозчика' } },
        { key: 'admin.print_order', val: { uk: 'Друк замовлення', en: 'Print Order', ru: 'Печать заказа' } },
        { key: 'admin.download_zip', val: { uk: 'Завантажити ZIP', en: 'Download ZIP', ru: 'Скачать ZIP' } },

        // ===== Analytics Settings =====
        { key: 'settings.analytics', val: { uk: 'Аналітика', en: 'Analytics', ru: 'Аналитика' } },
        { key: 'settings.analytics_desc', val: { uk: 'Налаштування Google Analytics та інших систем аналітики', en: 'Configure Google Analytics and other analytics systems', ru: 'Настройка Google Analytics и других систем аналитики' } },
        { key: 'settings.ga4_measurement_id', val: { uk: 'Google Analytics 4 (Measurement ID)', en: 'Google Analytics 4 (Measurement ID)', ru: 'Google Analytics 4 (Measurement ID)' } },
        { key: 'settings.yandex_metrica_id', val: { uk: 'Яндекс.Метрика (ID лічильника)', en: 'Yandex.Metrica (Counter ID)', ru: 'Яндекс.Метрика (ID счётчика)' } },
        { key: 'settings.facebook_pixel_id', val: { uk: 'Facebook Pixel ID', en: 'Facebook Pixel ID', ru: 'Facebook Pixel ID' } },

        // ===== Logo & Branding Settings =====
        { key: 'settings.branding', val: { uk: 'Брендинг', en: 'Branding', ru: 'Брендинг' } },
        { key: 'settings.branding_desc', val: { uk: 'Налаштування логотипу та назви сайту для різних мов', en: 'Configure site logo and name for different languages', ru: 'Настройка логотипа и названия сайта для разных языков' } },
        { key: 'settings.logo_suffix_uk', val: { uk: 'Назва бренду (UK)', en: 'Brand Name (UK)', ru: 'Название бренда (UK)' } },
        { key: 'settings.logo_suffix_ru', val: { uk: 'Назва бренду (RU)', en: 'Brand Name (RU)', ru: 'Название бренда (RU)' } },
        { key: 'settings.logo_suffix_en', val: { uk: 'Назва бренду (EN)', en: 'Brand Name (EN)', ru: 'Название бренда (EN)' } },
        { key: 'settings.logo_subtitle_uk', val: { uk: 'Підзаголовок (UK)', en: 'Subtitle (UK)', ru: 'Подзаголовок (UK)' } },
        { key: 'settings.logo_subtitle_ru', val: { uk: 'Підзаголовок (RU)', en: 'Subtitle (RU)', ru: 'Подзаголовок (RU)' } },
        { key: 'settings.logo_subtitle_en', val: { uk: 'Підзаголовок (EN)', en: 'Subtitle (EN)', ru: 'Подзаголовок (EN)' } },

        // ===== Upload Progress =====
        { key: 'upload.uploading', val: { uk: 'Завантаження...', en: 'Uploading...', ru: 'Загрузка...' } },
        { key: 'upload.uploaded', val: { uk: 'Завантажено', en: 'Uploaded', ru: 'Загружено' } },
        { key: 'upload.failed', val: { uk: 'Помилка', en: 'Failed', ru: 'Ошибка' } },
        { key: 'upload.retry', val: { uk: 'Повторити', en: 'Retry', ru: 'Повторить' } },
        { key: 'upload.add_more', val: { uk: 'Додати ще', en: 'Add more', ru: 'Добавить еще' } },

        // ===== Error messages =====
        { key: 'error.missing_files_refresh', val: { uk: 'Деякі файли втрачені через оновлення сторінки. Поверніться та додайте їх знову.', en: 'Some files were lost due to page refresh. Please go back and re-add them.', ru: 'Некоторые файлы потеряны из-за обновления страницы. Вернитесь и добавьте их снова.' } },

        // ===== Common UI =====
        { key: 'common.save', val: { uk: 'Зберегти', en: 'Save', ru: 'Сохранить' } },
        { key: 'common.cancel', val: { uk: 'Скасувати', en: 'Cancel', ru: 'Отмена' } },
        { key: 'common.delete', val: { uk: 'Видалити', en: 'Delete', ru: 'Удалить' } },
        { key: 'common.edit', val: { uk: 'Редагувати', en: 'Edit', ru: 'Редактировать' } },
        { key: 'common.close', val: { uk: 'Закрити', en: 'Close', ru: 'Закрыть' } },
        { key: 'common.confirm', val: { uk: 'Підтвердити', en: 'Confirm', ru: 'Подтвердить' } },
        { key: 'common.yes', val: { uk: 'Так', en: 'Yes', ru: 'Да' } },
        { key: 'common.no', val: { uk: 'Ні', en: 'No', ru: 'Нет' } },
        { key: 'currency', val: { uk: 'грн', en: 'UAH', ru: 'грн' } },
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

    // 8. Default Informational Pages (Multilingual)
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
                <h1 style="color: #009846;">FUJI-Світ: Професійний підхід до ваших знімків</h1>
                <p>Підприємство «FUJI-Світ» — лідер на ринку цифрового фотодруку...</p>
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
<div class="prose max-w-none text-slate-800">
    <div class="flex flex-col md:flex-row gap-8 items-start mb-8">
        <div class="flex-1">
            <p class="mb-4">
                <b>FUJI-Мир</b> - одно из лучших предприятий предоставляющих услуги цифровой печати фотографий как для фотолюбителей, так и для профессиональных фотографов.
            </p>
            <p class="mb-4">У нас вы можете заказать ряд дизайнерских услуг таких как:</p>
            <ul class="list-disc pl-5 mb-4 space-y-1">
                <li>сканирование фотографий и пленок;</li>
                <li>реставрация и компьютерная обработка фотографий;</li>
                <li>устранение эффекта красных глаз;</li>
                <li>разработка различных макетов и коллажей;</li>
                <li>а так же сделать фотографию на документы.</li>
            </ul>
            <p class="mb-4">
                Печать производится на профессиональном оборудовании фирмы <b>FUJI</b> - цифровой фотолаборатории <b>Frontier 500</b>.
            </p>
            <p class="mb-4">
                Высочайшее качество ваших фотографий гарантировано тем, что перед печатью все файлы просматриваются оператором и в большинстве случаев мы проводим необходимую цветовую и тоновую коррекцию изображения, устраняя таким образом возможные ошибки допущеные при съемке.
            </p>
            <p class="font-bold text-[#009846] text-lg">
                Будем рады всегда Вас видеть в числе наших клиентов, и постараемся оправдать Ваши ожидания.
            </p>
        </div>
        <div class="w-full md:w-1/3 flex flex-col gap-6">
             <div class="rounded-xl overflow-hidden shadow-md bg-white border p-2">
                <img src="/images/about/real_map.gif" alt="Карта Фуджи Мир" class="w-full h-auto" />
             </div>
             <div class="rounded-xl overflow-hidden shadow-md bg-white border p-2">
                <img src="/images/about/refined_magazin.png" alt="Вход в магазин Фуджи Мир" class="w-full h-auto" />
             </div>
        </div>
    </div>
</div>
        `,
        uk: `
<div class="prose max-w-none text-slate-800">
    <div class="flex flex-col md:flex-row gap-8 items-start mb-8">
        <div class="flex-1">
            <p class="mb-4">
                <b>FUJI-Світ</b> - одне з найкращих підприємств, що надають послуги цифрового друку фотографій як для фотолюбителів, так і для професійних фотографів.
            </p>
            <p class="mb-4">У нас ви можете замовити ряд дизайнерських послуг, таких як:</p>
            <ul class="list-disc pl-5 mb-4 space-y-1">
                <li>сканування фотографій та плівок;</li>
                <li>реставрація та комп'ютерна обробка фотографій;</li>
                <li>усунення ефекту червоних очей;</li>
                <li>розробка різноманітних макетів та колажів;</li>
                <li>а також зробити фотографію на документи.</li>
            </ul>
            <p class="mb-4">
                Друк проводиться на професійному обладнанні фірми <b>FUJI</b> - цифровій фотолабораторії <b>Frontier 500</b>.
            </p>
            <p class="mb-4">
                Найвища якість ваших фотографій гарантована тим, що перед друком всі файли переглядаються оператором і в більшості випадків ми проводимо необхідну кольорову та тонову корекцію зображення, усуваючи таким чином можливі помилки допущені при зйомці.
            </p>
            <p class="font-bold text-[#009846] text-lg">
                Будемо раді завжди Вас бачити серед наших клієнтів, і намагатимемося виправдати Ваші очікування.
            </p>
        </div>
        <div class="w-full md:w-1/3 flex flex-col gap-6">
             <div class="rounded-xl overflow-hidden shadow-md bg-white border p-2">
                <img src="/images/about/real_map.gif" alt="Карта Fuji-Світ" class="w-full h-auto" />
             </div>
             <div class="rounded-xl overflow-hidden shadow-md bg-white border p-2">
                <img src="/images/about/refined_magazin.png" alt="Магазин Fuji-Світ" class="w-full h-auto" />
             </div>
        </div>
    </div>
</div>
        `,
        en: `
<div class="prose max-w-none text-slate-800">
    <div class="flex flex-col md:flex-row gap-8 items-start mb-8">
        <div class="flex-1">
            <p class="mb-4">
                <b>FUJI-Mir</b> is one of the best enterprises providing digital photo printing services for both amateurs and professional photographers.
            </p>
            <p class="mb-4">You can order a range of design services such as:</p>
            <ul class="list-disc pl-5 mb-4 space-y-1">
                <li>scanning photos and films;</li>
                <li>restoration and computer processing of photos;</li>
                <li>red-eye removal;</li>
                <li>development of various layouts and collages;</li>
                <li>and also ID photos.</li>
            </ul>
            <p class="mb-4">
                Printing is done on professional equipment from <b>FUJI</b> - digital minilab <b>Frontier 500</b>.
            </p>
            <p class="mb-4">
                The highest quality of your photos is guaranteed because all files are reviewed by an operator before printing, and in most cases, we perform necessary color and tone corrections, eliminating potential errors made during shooting.
            </p>
            <p class="font-bold text-[#009846] text-lg">
                We look forward to seeing you among our clients and will try to meet your expectations.
            </p>
        </div>
        <div class="w-full md:w-1/3 flex flex-col gap-6">
             <div class="rounded-xl overflow-hidden shadow-md bg-white border p-2">
                <img src="/images/about/real_map.gif" alt="Map Fujimir" class="w-full h-auto" />
             </div>
             <div class="rounded-xl overflow-hidden shadow-md bg-white border p-2">
                <img src="/images/about/refined_magazin.png" alt="Fujimir Shop" class="w-full h-auto" />
             </div>
        </div>
    </div>
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

    // 9. Magnet Prices
    console.log('Seeding Magnet Prices...');
    const magnets = [
        { sizeSlug: '10x15', price: 29.00 },
        { sizeSlug: '13x18', price: 39.00 },
        { sizeSlug: '15x20', price: 65.00 },
        { sizeSlug: '20x30', price: 120.00 },
        { sizeSlug: '9x13', price: 29.00 },
    ];
    for (const m of magnets) {
        const exist = await prisma.magnetPrice.findFirst({ where: { sizeSlug: m.sizeSlug } });
        if (!exist) {
            await prisma.magnetPrice.create({ data: { sizeSlug: m.sizeSlug, price: m.price, isActive: true } });
        }
    }

    // 10. Order Sequence
    console.log('Seeding Order Sequence...');
    // Use try-catch or explicit check to avoid errors if model not generated yet (though logic implies it should exist)
    // Assuming model is generated
    const seq = await prisma.orderSequence.findFirst();
    if (!seq) {
        await prisma.orderSequence.create({ data: { currentValue: 10000 } });
    }

    // 11. General Settings
    console.log('Seeding Settings...');
    const settings = [
        { key: 'contact_address', value: 'м. Дніпро, вул. Європейська (Миронова), 8' },
        { key: 'contact_phone', value: '+380992150317' },
        { key: 'polaroid_frame_price', value: '10.00' },
    ];
    for (const s of settings) {
        await prisma.setting.upsert({
            where: { key: s.key },
            update: { value: s.value },
            create: { key: s.key, value: s.value, description: s.key.replace('_', ' ') }
        });
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
