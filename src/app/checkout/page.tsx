"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, calculateItemPrice } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle2, Upload, Gift, Truck, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { NovaPoshtaSelector } from "@/components/novaposhta-selector";
import { toast } from "sonner";

type GiftChoice = 'FREE_DELIVERY' | 'FREE_MAGNET';
type MagnetOption = 'upload' | 'existing' | 'comment';

interface DeliveryOption {
    id: number;
    slug: string; // 'local', 'novaposhta', 'pickup'
    name: string;
    price: number;
    description: string | null;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items, clearCart, config, checkoutForm, setCheckoutForm } = useCartStore();
    const { t } = useTranslation();
    const magnetFileRef = useRef<HTMLInputElement>(null);

    const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
    const [loadingDelivery, setLoadingDelivery] = useState(true);

    const [formData, setFormData] = useState(() => {
        // Initialize from store
        const storeForm = useCartStore.getState().checkoutForm;
        return {
            firstName: storeForm.firstName || "",
            lastName: storeForm.lastName || "",
            phone: storeForm.phone || "",
            email: storeForm.email || "",
            deliveryAddress: storeForm.deliveryAddress || "",
            deliveryMethod: storeForm.deliveryMethod || "pickup",
            recipientCityRef: storeForm.recipientCityRef || "",
            recipientWarehouseRef: storeForm.recipientWarehouseRef || "",
        };
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderComplete, setOrderComplete] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [firstNameError, setFirstNameError] = useState<string | null>(null);
    const [lastNameError, setLastNameError] = useState<string | null>(null);
    const [addressError, setAddressError] = useState<string | null>(null);
    const [giftError, setGiftError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);

    // Gift selection state
    const [giftChoice, setGiftChoice] = useState<GiftChoice | null>(null);
    const [magnetOption, setMagnetOption] = useState<MagnetOption | null>(null);
    const [magnetPhotoId, setMagnetPhotoId] = useState<string | null>(null); // ID from existing photos
    const [magnetFile, setMagnetFile] = useState<File | null>(null);
    const [magnetComment, setMagnetComment] = useState<string>("");

    // Sync only TO store, not from store (except initial)
    // This prevents infinite loops

    useEffect(() => {
        setCheckoutForm(formData);
    }, [formData, setCheckoutForm]);

    useEffect(() => {
        // Fetch delivery options
        fetch('/api/fujiadmin/config/delivery')
            .then(res => res.json())
            .then(data => {
                setDeliveryOptions(data);
                // Set default to pickup if available, or first option
                const pickup = data.find((d: any) => d.slug === 'pickup');
                // Only set default if store didn't provide a method (or it's pickup anyway)
                if (pickup && (!checkoutForm.deliveryMethod || checkoutForm.deliveryMethod === 'pickup')) {
                    // Keep existing logic or strictly respect store? 
                    // Since hydration happens in parallel allow setState to potentially overwrite if store was empty?
                    // Actually, hydration is in separate useEffect.
                    // We should only set default if formData.deliveryMethod is "pickup" (initial) AND we want to ensure valid default.
                    // But store might have set it to "novaposhta".
                    // Safe approach: check if formData.deliveryMethod matches pickup (initial default)
                    // But formData is closure-captured here (it's [], so formData is initial state).
                    // We rely on 'setFormData(prev...)'
                    setFormData(prev => {
                        if (prev.deliveryMethod === 'pickup' && !checkoutForm.deliveryMethod) {
                            return { ...prev, deliveryMethod: pickup.slug };
                        }
                        return prev;
                    });
                }
                setLoadingDelivery(false);
            })
            .catch(err => {
                console.error("Failed to fetch delivery options", err);
                setLoadingDelivery(false);
            });
    }, []);

    const groupedItems = useMemo(() => {
        if (!config) return [];
        const groups = new Map();
        items.forEach(item => {
            const key = JSON.stringify({
                size: item.options.size,
                paper: item.options.paper,
                options: item.options.options || {}
            });
            if (!groups.has(key)) {
                groups.set(key, {
                    count: 0,
                    options: item.options,
                    subtotal: 0
                });
            }
            const group = groups.get(key);
            group.count += item.options.quantity;
            group.subtotal += calculateItemPrice(item.options, config).total;
        });
        return Array.from(groups.values());
    }, [items, config]);

    const totalStats = items.reduce((acc, item) => {
        if (!config) return acc;
        const price = calculateItemPrice(item.options, config);
        return {
            total: acc.total + price.total,
            savings: acc.savings + price.savings
        };
    }, { total: 0, savings: 0 });

    // Delivery calculation
    const activeDeliveryOption = deliveryOptions.find(d => d.slug === formData.deliveryMethod);
    const deliveryPriceRaw = activeDeliveryOption?.price || 0;
    const deliveryPrice = (giftChoice === 'FREE_DELIVERY') ? 0 : deliveryPriceRaw;
    const finalTotal = totalStats.total + deliveryPrice;

    const activeGift = config?.gifts
        ?.filter(g => totalStats.total >= g.minAmount)
        ?.sort((a, b) => b.minAmount - a.minAmount)[0];

    // Helper function to scroll to error
    const scrollToError = (elementId: string) => {
        setTimeout(() => {
            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.focus();
            }
        }, 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset errors
        setFirstNameError(null);
        setLastNameError(null);
        setPhoneError(null);
        setAddressError(null);
        setAddressError(null);
        setGiftError(null);
        setEmailError(null);

        // Custom validation
        const isNP = formData.deliveryMethod === 'novaposhta';

        if (!formData.firstName.trim()) {
            setFirstNameError(t('validation.required_field'));
            scrollToError('checkout-firstname');
            return;
        }

        if (isNP && !formData.lastName.trim()) {
            setLastNameError(t('validation.required_field'));
            scrollToError('checkout-lastname');
            return;
        }

        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            setPhoneError(t('checkout.phone_error'));
            scrollToError('checkout-phone');
            return;
        }

        // Validate Email (Strict)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            setEmailError(t('validation.invalid_email') || 'Please enter a valid email');
            scrollToError('checkout-email');
            return;
        }

        if (formData.deliveryMethod !== 'pickup' && !formData.deliveryAddress.trim()) {
            setAddressError(t('validation.required_field'));
            scrollToError('checkout-address');
            return;
        }

        // Check if gift is available but not selected
        if (activeGift && !giftChoice) {
            setGiftError(t('gift.select_required'));
            scrollToError('gift-section');
            return;
        }

        // Check magnet comments
        if (giftChoice === 'FREE_MAGNET' && magnetOption === 'comment' && !magnetComment.trim()) {
            setGiftError(t('validation.required_field'));
            scrollToError('gift-section');
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Process items (ensure all have server files)
            const processedItems = [];
            const filesToUpload = new Map<File, string>(); // file -> id to associate later if needed, or just upload unique files

            // Check for missing files first
            const missingFiles = items.filter(i => !i.serverFileName && !i.file);
            if (missingFiles.length > 0) {
                toast.error(t('error.missing_files_refresh') || "Some files are lost due to refresh. Please go back and re-add them.");
                setIsSubmitting(false);
                return;
            }

            // Identify files needing upload (fallback)
            const itemsNeedingUpload = items.filter(i => !i.serverFileName && i.file);

            // Deduplicate files to upload
            const uniqueFilesToUpload = Array.from(new Set(itemsNeedingUpload.map(i => i.file!)));
            const uploadedFilesMap = new Map<File, { server: string, original: string }>();

            // Upload missing files
            for (const file of uniqueFilesToUpload) {
                const formDataUpload = new FormData();
                formDataUpload.append("file", file);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formDataUpload
                });

                if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`);
                const { fileName, originalName } = await uploadRes.json();
                uploadedFilesMap.set(file, { server: fileName, original: originalName });
            }

            // 2. Upload magnet photo if provided (NEW upload)
            let magnetFileData: { server: string, original: string } | null = null;
            if (giftChoice === 'FREE_MAGNET' && magnetOption === 'upload' && magnetFile) {
                const magnetFormData = new FormData();
                magnetFormData.append("file", magnetFile);

                const magnetUploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: magnetFormData
                });

                if (magnetUploadRes.ok) {
                    const { fileName, originalName } = await magnetUploadRes.json();
                    magnetFileData = { server: fileName, original: originalName };
                }
            }

            // 3. Build notes with gift info (Same as before)
            let orderNotes = "";
            if (activeDeliveryOption) {
                orderNotes += `🚚 Доставка: ${activeDeliveryOption.name}`;
                if (giftChoice === 'FREE_DELIVERY' && activeDeliveryOption.price > 0) orderNotes += ` (БЕЗКОШТОВНО ЗА БОНУС)`;
                orderNotes += `\n`;
            }

            if (activeGift && giftChoice) {
                if (giftChoice === 'FREE_DELIVERY') {
                    orderNotes += `🎁 ПОДАРУНОК: БЕЗКОШТОВНА ДОСТАВКА\n`;
                } else if (giftChoice === 'FREE_MAGNET') {
                    orderNotes += `🎁 ПОДАРУНОК: БЕЗКОШТОВНИЙ МАГНІТ 10x15\n`;
                    if (magnetOption === 'upload' && magnetFileData) {
                        orderNotes += `📷 Нове фото (завантажено): ${magnetFileData.original}`;
                    } else if (magnetOption === 'existing' && magnetPhotoId) {
                        const selectedItem = items.find(i => i.id === magnetPhotoId);
                        orderNotes += `📷 Фото з замовлення: ${selectedItem?.file?.name || magnetPhotoId}`;
                    } else if (magnetOption === 'comment' && magnetComment) {
                        orderNotes += `💬 Коментар клієнта: ${magnetComment}`;
                    }
                }
            }

            // 4. Prepare order items
            let orderItems = items.map(item => {
                // Determine server file: 
                // 1. Already has serverFileName? Use it.
                // 2. Was just uploaded? Use map.
                let serverName = item.serverFileName;
                let originalName = item.name; // item.name is persistent

                if (!serverName && item.file) {
                    const uploaded = uploadedFilesMap.get(item.file);
                    if (uploaded) {
                        serverName = uploaded.server;
                        originalName = uploaded.original; // Update original name just in case
                    }
                }

                return {
                    id: item.id,
                    options: item.options,
                    fileName: originalName,
                    serverFileName: serverName,
                    priceSnapshot: config ? calculateItemPrice(item.options, config).unitPrice : 0,
                    isGiftMagnet: false,
                };
            });

            // Add gift magnet as SEPARATE item 
            if (giftChoice === 'FREE_MAGNET') {
                if (magnetOption === 'existing' && magnetPhotoId) {
                    const originalItem = items.find(i => i.id === magnetPhotoId);
                    // For existing item, we prefer serverFileName, or fallback to map if it was just uploaded
                    let serverName = originalItem?.serverFileName;
                    if (!serverName && originalItem?.file) {
                        const uploaded = uploadedFilesMap.get(originalItem.file);
                        if (uploaded) serverName = uploaded.server;
                    }

                    if (originalItem && serverName) {
                        orderItems = [{
                            id: 'gift-magnet-' + Date.now(),
                            options: { size: '10x15', paper: 'glossy', quantity: 1, options: { magnetic: true } },
                            fileName: originalItem.name,
                            serverFileName: serverName,
                            priceSnapshot: 0,
                            isGiftMagnet: true,
                        }, ...orderItems];
                    }
                } else if (magnetOption === 'upload' && magnetFileData) {
                    orderItems = [{
                        id: 'gift-magnet-' + Date.now(),
                        options: { size: '10x15', paper: 'glossy', quantity: 1, options: { magnetic: true } },
                        fileName: magnetFileData.original,
                        serverFileName: magnetFileData.server,
                        priceSnapshot: 0,
                        isGiftMagnet: true,
                    }, ...orderItems];
                }
            }

            // 5. Create Order
            const { draftOrderId } = useCartStore.getState();
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer: formData,
                    items: orderItems,
                    total: finalTotal, // Use final total with delivery
                    notes: orderNotes,
                    giftChoice: giftChoice,
                    draftOrderId: draftOrderId,
                    recipientCityRef: formData.recipientCityRef,
                    recipientWarehouseRef: formData.recipientWarehouseRef
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Order failed server response:", errorData);
                throw new Error(errorData.message || "Order failed");
            }

            const data = await response.json();
            setOrderComplete(data.orderNumber);
            clearCart();
        } catch (error: any) {
            console.error("Checkout submission error:", error);
            toast.error(`Something went wrong: ${error.message}. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (orderComplete) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center p-6">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('checkout.order_confirmed')}</h2>
                    <p className="text-slate-600 mb-6">
                        Order <span className="font-mono font-medium text-slate-900">#{orderComplete}</span>
                    </p>
                    <Button onClick={() => router.push("/")} className="w-full">
                        {t('checkout.return_home')}
                    </Button>
                </Card>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <p className="text-slate-500 mb-4">{t('checkout.empty')}</p>
                <Link href="/upload">
                    <Button>{t('nav.upload')}</Button>
                </Link>
            </div>
        )
    }

    const isNP = formData.deliveryMethod === 'novaposhta';

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/upload" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" /> {t('checkout.back')}
                </Link>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Form - Compact Left Column */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('checkout.shipping_contact')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">{t('checkout.firstname') || 'Имя'}</label>
                                            <Input
                                                id="checkout-firstname"
                                                placeholder={t('checkout.firstname') || 'Имя'}
                                                value={formData.firstName}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, firstName: e.target.value });
                                                    if (firstNameError) setFirstNameError(null);
                                                }}
                                                className={firstNameError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                            />
                                            {firstNameError && <p className="text-sm text-red-500 mt-1">{firstNameError}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {t('checkout.lastname') || 'Фамилия'}
                                                {isNP && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <Input
                                                id="checkout-lastname"
                                                placeholder={t('checkout.lastname') || 'Фамилия'}
                                                value={formData.lastName}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, lastName: e.target.value });
                                                    if (lastNameError) setLastNameError(null);
                                                }}
                                                className={lastNameError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                            />
                                            {lastNameError && <p className="text-sm text-red-500 mt-1">{lastNameError}</p>}
                                        </div>
                                    </div>
                                    {isNP && (
                                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                            ⚠️ {t('checkout.fullname_hint') || 'Введите имя и фамилию для Новой Почты'}
                                        </p>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t('checkout.phone')}</label>
                                        <Input
                                            id="checkout-phone"
                                            type="tel"
                                            placeholder="+380..."
                                            value={formData.phone}
                                            onChange={(e) => {
                                                setFormData({ ...formData, phone: e.target.value });
                                                if (phoneError) setPhoneError(null);
                                            }}
                                            className={phoneError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        />
                                        {phoneError && <p className="text-sm text-red-500 mt-1">{phoneError}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t('checkout.email')}</label>
                                        <Input
                                            id="checkout-email"
                                            type="email"
                                            placeholder="email@example.com"
                                            value={formData.email}
                                            onChange={(e) => {
                                                setFormData({ ...formData, email: e.target.value });
                                                if (emailError) setEmailError(null);
                                            }}
                                            className={emailError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        />
                                        {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">{t('checkout.delivery_method')}</label>

                                        {loadingDelivery ? (
                                            <div className="text-center text-sm text-slate-500 py-4">{t('Loading')}...</div>
                                        ) : (
                                            <div className="space-y-3">
                                                {/* Sort: pickup first, then local, then novaposhta */}
                                                {[...deliveryOptions]
                                                    .sort((a, b) => {
                                                        const order: Record<string, number> = { pickup: 0, local: 1, novaposhta: 2 };
                                                        return (order[a.slug] ?? 99) - (order[b.slug] ?? 99);
                                                    })
                                                    .map((option) => (
                                                        <div key={option.id} className="space-y-2">
                                                            {/* Delivery Option Button */}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, deliveryMethod: option.slug, deliveryAddress: "" });
                                                                    if (addressError) setAddressError(null);
                                                                }}
                                                                className={`w-full p-3 border rounded-lg text-left transition-colors flex justify-between items-center ${formData.deliveryMethod === option.slug
                                                                    ? "border-primary-600 bg-primary-50 text-primary-900"
                                                                    : "border-slate-200 hover:border-slate-300"
                                                                    }`}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{option.name}</span>
                                                                    {option.description && <span className="text-xs text-slate-500 mt-0.5">{option.description}</span>}
                                                                </div>
                                                                <div className="text-sm font-bold whitespace-nowrap ml-4">
                                                                    {giftChoice === 'FREE_DELIVERY' && option.price > 0
                                                                        ? <span className="text-green-600">{t('checkout.free')}</span>
                                                                        : (option.price > 0 ? `${option.price} ${t('general.currency')}` : null)
                                                                    }
                                                                </div>
                                                            </button>

                                                            {/* Inline Address Field - shown only when this option is selected */}
                                                            {formData.deliveryMethod === option.slug && option.slug === "local" && (
                                                                <div className="ml-4 pl-4 border-l-2 border-primary-200 animate-in slide-in-from-top-1 duration-200">
                                                                    <label className="text-sm font-medium text-slate-600 block mb-1.5">{t('checkout.delivery_address')}</label>
                                                                    <Input
                                                                        id="checkout-address"
                                                                        placeholder={t('checkout.delivery_address')}
                                                                        value={formData.deliveryAddress}
                                                                        onChange={(e) => {
                                                                            setFormData({ ...formData, deliveryAddress: e.target.value });
                                                                            if (addressError) setAddressError(null);
                                                                        }}
                                                                        className={addressError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                                                    />
                                                                    {addressError && <p className="text-sm text-red-500 mt-1">{addressError}</p>}
                                                                </div>
                                                            )}

                                                            {formData.deliveryMethod === option.slug && option.slug === "novaposhta" && (
                                                                <div className="ml-4 pl-4 border-l-2 border-primary-200 animate-in slide-in-from-top-1 duration-200">
                                                                    <NovaPoshtaSelector
                                                                        value={formData.deliveryAddress}
                                                                        onChange={(value) => {
                                                                            setFormData({ ...formData, deliveryAddress: value });
                                                                            if (addressError) setAddressError(null);
                                                                        }}
                                                                        onRefsChange={(cityRef, warehouseRef) => {
                                                                            setFormData(prev => ({ ...prev, recipientCityRef: cityRef, recipientWarehouseRef: warehouseRef }));
                                                                        }}
                                                                        error={addressError}
                                                                        onClearError={() => setAddressError(null)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Application Summary - Expanded Right Column */}
                    <div className="lg:col-span-7">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>{t('checkout.summary')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                    {/* Grouped Items Summary */}
                                    {groupedItems.map((group: any, idx) => (
                                        <div key={idx} className="flex flex-col border-b border-slate-100 last:border-0 pb-3 mb-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-medium text-slate-900">
                                                        {t('Size')} {group.options.size}, {t(group.options.paper)}
                                                    </div>
                                                    <div className="text-sm text-slate-500">
                                                        {group.count} {t('pcs')}
                                                    </div>
                                                </div>
                                                <div className="font-bold">
                                                    {group.subtotal.toFixed(2)} {t('general.currency')}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {group.options.options?.border && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-[#009846]/10 text-[#009846] border border-[#009846]/20 uppercase">
                                                        {t('badge.border') || t('Border')}
                                                    </span>
                                                )}
                                                {group.options.options?.magnetic && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-[#e31e24]/10 text-[#e31e24] border border-[#e31e24]/20 uppercase">
                                                        {t('badge.mag') || t('Magnet')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>



                                {/* ... Gift Section ... */}
                                {activeGift && (
                                    <div id="gift-section" className={`bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 ${giftError ? 'border-red-400' : 'border-green-300'} space-y-3`}>
                                        <div className="flex items-center gap-2 text-green-700 font-bold">
                                            <Gift className="w-5 h-5" />
                                            {t('gift.title')}
                                        </div>
                                        <p className="text-sm text-green-600">{t('gift.choose')}</p>
                                        {giftError && <p className="text-sm text-red-500 font-medium">{giftError}</p>}

                                        {/* Gift Choice Buttons */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { setGiftChoice('FREE_DELIVERY'); setMagnetOption(null); setGiftError(null); }}
                                                className={`p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${giftChoice === 'FREE_DELIVERY'
                                                    ? 'border-green-500 bg-green-100 text-green-800'
                                                    : 'border-gray-200 hover:border-green-300'
                                                    }`}
                                            >
                                                <Truck className="w-5 h-5" />
                                                <span className="font-medium">{t('gift.free_delivery')}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => { setGiftChoice('FREE_MAGNET'); setGiftError(null); }}
                                                className={`p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${giftChoice === 'FREE_MAGNET'
                                                    ? 'border-purple-500 bg-purple-100 text-purple-800'
                                                    : 'border-gray-200 hover:border-purple-300'
                                                    }`}
                                            >
                                                <ImageIcon className="w-5 h-5" />
                                                <span className="font-medium">{t('gift.free_magnet')}</span>
                                            </button>
                                        </div>

                                        {/* Magnet Options (if magnet selected) */}
                                        {giftChoice === 'FREE_MAGNET' && (
                                            <div className="mt-3 space-y-2 pl-4 border-l-2 border-purple-300">
                                                <p className="text-xs text-purple-600 font-medium uppercase">{t('gift.free_magnet')} — {t('gift.select_photo')}:</p>

                                                {/* Option 1: Upload new photo */}
                                                <button
                                                    type="button"
                                                    onClick={() => { setMagnetOption('upload'); magnetFileRef.current?.click(); }}
                                                    className={`w-full p-2 rounded border text-left text-sm flex items-center gap-2 ${magnetOption === 'upload' ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                                                        }`}
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    {t('gift.magnet_upload')}
                                                    {magnetFile && <span className="text-xs text-green-600 ml-auto">✓ {magnetFile.name.slice(0, 15)}...</span>}
                                                </button>
                                                <input
                                                    ref={magnetFileRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setMagnetFile(file);
                                                            setMagnetOption('upload');
                                                        }
                                                    }}
                                                />

                                                {/* Option 2: Select from existing - simple dropdown */}
                                                <div className={`p-2 rounded border ${magnetOption === 'existing' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`}>
                                                    <label className="text-sm flex items-center gap-2 mb-1">
                                                        <input
                                                            type="radio"
                                                            name="magnetOption"
                                                            checked={magnetOption === 'existing'}
                                                            onChange={() => setMagnetOption('existing')}
                                                        />
                                                        {t('gift.magnet_existing')}
                                                    </label>
                                                    {magnetOption === 'existing' && (
                                                        <select
                                                            className="w-full p-2 border rounded text-sm mt-1"
                                                            value={magnetPhotoId || ''}
                                                            onChange={(e) => setMagnetPhotoId(e.target.value)}
                                                        >
                                                            <option value="">-- {t('gift.select_photo')} --</option>
                                                            {items.slice(0, 50).map((item, idx) => (
                                                                <option key={item.id} value={item.id}>
                                                                    #{idx + 1}: {item.file?.name?.slice(0, 30) || `${t('Photo')} ${idx + 1}`}
                                                                </option>
                                                            ))}
                                                            {items.length > 50 && <option disabled>... {t('and_more')} {items.length - 50} {t('фото')}</option>}
                                                        </select>
                                                    )}
                                                </div>

                                                {/* Option 3: Leave a comment */}
                                                <div className={`p-2 rounded border ${magnetOption === 'comment' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`}>
                                                    <label className="text-sm flex items-center gap-2 mb-1">
                                                        <input
                                                            type="radio"
                                                            name="magnetOption"
                                                            checked={magnetOption === 'comment'}
                                                            onChange={() => setMagnetOption('comment')}
                                                        />
                                                        {t('gift.magnet_comment')}
                                                    </label>
                                                    {magnetOption === 'comment' && (
                                                        <Input
                                                            className="mt-1"
                                                            placeholder={t('gift.magnet_photo_placeholder')}
                                                            value={magnetComment}
                                                            onChange={(e) => setMagnetComment(e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between items-center text-sm text-slate-600">
                                        <span>{t('pricing.photo_print')}</span>
                                        <span className="font-medium">{totalStats.total.toFixed(2)} {t('general.currency')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-slate-600">
                                        <span>{t('pricing.delivery')}: {activeDeliveryOption?.name}</span>
                                        <span className={`font-medium ${giftChoice === 'FREE_DELIVERY' || activeDeliveryOption?.slug === 'pickup' ? 'text-green-600' : ''}`}>
                                            {giftChoice === 'FREE_DELIVERY'
                                                ? t('checkout.free')
                                                : (deliveryPrice > 0
                                                    ? `${deliveryPrice.toFixed(2)} ${t('general.currency')}`
                                                    : (activeDeliveryOption?.slug === 'pickup' ? t('checkout.free') : t('pricing.by_tariff'))
                                                )
                                            }
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-start pt-2 border-t mt-2">
                                        <span className="font-semibold text-lg mt-1">{t('checkout.total')}</span>
                                        <div className="text-right">
                                            <div className="font-bold text-xl text-primary-600">{finalTotal.toFixed(2)} {t('general.currency')}</div>
                                            {totalStats.savings > 0 && (
                                                <div className="text-xs font-bold text-green-600 mt-1">
                                                    {t('Saved')}: {totalStats.savings.toFixed(2)} {t('general.currency')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    size="lg"
                                    type="submit"
                                    form="checkout-form"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('common.processing') || 'Processing...'}
                                        </>
                                    ) : (
                                        t('checkout.placeOrder')
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div >
                </div >
            </div >
        </div >
    );
}
