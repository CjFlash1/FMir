"use client";

import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import { ArrowLeft, Download, FileImage, CreditCard, Truck, User, Trash2, Archive, X, ChevronDown, Gift, Printer, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TTNModal } from "./ttn-modal";
import { STATUS_COLORS } from "@/lib/constants/order-statuses";
import { getFilesFromItem, getDeliveryCostSync } from "@/lib/helpers/order-utils";
import { toast } from "sonner";

interface DownloadPart {
    part: number;
    from: number;
    to: number;
}

interface PartsInfo {
    totalFiles: number;
    totalParts: number;
    photosPerPart: number;
    parts: DownloadPart[];
}

export function OrderDetailView({ order }: { order: any }) {
    const { t } = useTranslation();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    // Gallery State
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    // Other State
    const [partsInfo, setPartsInfo] = useState<PartsInfo | null>(null);
    const [showPartsDropdown, setShowPartsDropdown] = useState(false);
    const [itemsToShow, setItemsToShow] = useState(50); // Pagination for items
    const [currentStatus, setCurrentStatus] = useState(order.status);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showTTNModal, setShowTTNModal] = useState(false);
    const [orderTTN, setOrderTTN] = useState(order.ttnNumber);

    const ITEMS_PER_PAGE = 50;

    // Flatten all images for gallery navigation
    const allImages = useMemo(() => {
        const images: any[] = [];
        order.items.forEach((item: any, itemIndex: number) => {
            const files = getFilesFromItem(item);
            files.forEach((f, fileIndex) => {
                images.push({
                    src: `/api/uploads/${f.server}`,
                    originalName: f.original || item.fileName || `photo-${itemIndex}-${fileIndex}.jpg`,
                    serverName: f.server,
                    size: item.options?.size || item.size,
                    paper: item.options?.paper || item.paper,
                    quantity: item.options?.quantity || 1,
                    itemIndex: itemIndex,
                    filesInItem: files.length,
                    fileIndexInItem: fileIndex
                });
            });
        });
        return images;
    }, [order.items]);

    // Keyboard Navigation for Gallery
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (previewIndex === null) return;
            if (e.key === 'ArrowLeft') setPreviewIndex(prev => (prev! > 0 ? prev! - 1 : allImages.length - 1));
            if (e.key === 'ArrowRight') setPreviewIndex(prev => (prev! < allImages.length - 1 ? prev! + 1 : 0));
            if (e.key === 'Escape') setPreviewIndex(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewIndex, allImages.length]);

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdatingStatus(true);
        try {
            const res = await fetch(`/api/fujiadmin/orders/${order.id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setCurrentStatus(newStatus);
                router.refresh();
                toast.success(t("admin.status_updated") || "Status updated");
            } else {
                toast.error(t("admin.status_update_failed") || "Failed to update status");
            }
        } catch (error) {
            console.error("Status update failed:", error);
            toast.error(t("admin.status_update_failed") || "Failed to update status");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Fetch parts info on mount
    useEffect(() => {
        fetch(`/api/admin/orders/${order.id}/parts`)
            .then(res => res.json())
            .then(data => setPartsInfo(data))
            .catch(console.error);
    }, [order.id]);

    const handleDelete = async () => {
        if (!confirm(t('Are you sure you want to delete this order? This action cannot be undone.'))) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/orders/${order.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                router.push('/fujiadmin/orders');
                router.refresh();
                toast.success(t("admin.order_deleted") || "Order deleted");
            } else {
                toast.error('Failed to delete order');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error deleting order');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelTTN = async () => {
        if (!confirm('Ви дійсно хочете видалити ТТН у системі Нової Пошти?')) return;
        try {
            const res = await fetch(`/api/fujiadmin/orders/${order.id}/ttn`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setOrderTTN(null);
                router.refresh();
                toast.success('ТТН видалено');
            } else {
                const data = await res.json();
                toast.error(`Помилка: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
            toast.error('Помилка при видаленні ТТН');
        }
    };

    const handleDownloadPart = (part: number) => {
        window.location.href = `/api/admin/orders/${order.id}/download?part=${part}`;
        setShowPartsDropdown(false);
    };

    const handleDownloadAll = () => {
        if (!partsInfo) return;

        if (partsInfo.totalParts > 1) {
            // Show dropdown for multiple parts
            setShowPartsDropdown(!showPartsDropdown);
        } else {
            // Single part - download directly
            handleDownloadPart(1);
        }
    };

    // Calculate order summary for print
    const orderSummary = useMemo(() => {
        const sizes: Record<string, number> = {};
        const papers: Record<string, number> = {};
        let magnets = 0;
        let borders = 0;
        let totalPhotos = 0;

        order.items.forEach((item: any) => {
            const qty = item.options?.quantity || 1;
            totalPhotos += qty;

            // Sizes
            const size = item.options?.size || item.size || 'Unknown';
            sizes[size] = (sizes[size] || 0) + qty;

            // Papers
            const paper = item.options?.paper || item.paper || 'Unknown';
            papers[paper] = (papers[paper] || 0) + qty;

            // Options
            if (item.options?.options?.magnetic) magnets += qty;
            if (item.options?.options?.border) borders += qty;
        });

        return { sizes, papers, magnets, borders, totalPhotos };
    }, [order.items]);

    // Delivery Cost Display
    const deliveryCostDisplay = useMemo(() => {
        return getDeliveryCostSync(order.deliveryMethod);
    }, [order.deliveryMethod]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        const sizesStr = Object.entries(orderSummary.sizes).map(([s, c]) => s + ': ' + c).join(', ');
        const papersStr = Object.entries(orderSummary.papers).map(([p, c]) => p + ': ' + c).join(', ');
        const optionsArr: string[] = [];
        if (orderSummary.magnets > 0) optionsArr.push('Магн: ' + orderSummary.magnets);
        if (orderSummary.borders > 0) optionsArr.push('Борд: ' + orderSummary.borders);
        const optionsStr = optionsArr.length > 0 ? optionsArr.join(', ') : '-';

        // Get delivery method translation
        const deliveryMethodDisplay =
            order.deliveryMethod === 'pickup' || order.deliveryMethod === 'PICKUP'
                ? t('checkout.pickup')
                : order.deliveryMethod === 'local'
                    ? t('checkout.local')
                    : order.deliveryMethod === 'novaposhta'
                        ? t('checkout.novaposhta')
                        : order.deliveryMethod;

        const giftSection = order.notes ?
            '<div class="gift"><b>🎁</b> ' + order.notes + '</div>' : '';

        const html = '<!DOCTYPE html>' +
            '<html>' +
            '<head>' +
            '<title>Заказ #' + order.orderNumber + '</title>' +
            '<style>' +
            '* { margin: 0; padding: 0; box-sizing: border-box; }' +
            'body { font-family: Arial, sans-serif; font-size: 11px; padding: 8px; max-width: 380px; }' +
            '.header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 6px; }' +
            '.order-num { font-size: 20px; font-weight: bold; }' +
            '.date { font-size: 9px; color: #555; }' +
            '.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px; }' +
            '.box { border: 1px solid #ccc; padding: 5px; border-radius: 3px; }' +
            '.box-title { font-size: 9px; font-weight: bold; color: #555; text-transform: uppercase; margin-bottom: 3px; }' +
            '.row { margin-bottom: 1px; }' +
            '.gift { background: #e8f5e9; border: 1px solid #4caf50; padding: 5px; border-radius: 3px; margin-bottom: 6px; font-size: 10px; }' +
            '.summary { background: #f5f5f5; padding: 5px; border-radius: 3px; margin-bottom: 6px; }' +
            '.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; font-size: 10px; }' +
            '.summary-label { font-size: 9px; color: #666; }' +
            '.summary-value { font-weight: bold; }' +
            '.total-row { display: flex; justify-content: space-between; border-top: 1px solid #000; padding-top: 5px; font-weight: bold; font-size: 12px; }' +
            '</style>' +
            '</head>' +
            '<body>' +
            '<div class="header"><div class="order-num">#' + order.orderNumber + '</div>' +
            '<div class="date">' + new Date(order.createdAt).toLocaleString('uk-UA') + '</div></div>' +

            '<div class="grid">' +
            '<div class="box"><div class="box-title">👤 Клієнт</div>' +
            '<div class="row"><b>' + order.customerName + '</b></div>' +
            '<div class="row">' + order.customerPhone + '</div>' +
            (order.customerEmail ? '<div class="row">' + order.customerEmail + '</div>' : '') +
            '</div>' +
            '<div class="box"><div class="box-title">🚚 Доставка</div>' +
            '<div class="row"><b>' + deliveryMethodDisplay + '</b></div>' +
            (order.deliveryAddress ? '<div class="row">' + order.deliveryAddress + '</div>' : '') +
            '</div></div>' +
            giftSection +

            '<div class="summary"><div class="summary-grid">' +
            '<div><span class="summary-label">Розміри:</span><br><span class="summary-value">' + sizesStr + '</span></div>' +
            '<div><span class="summary-label">Папір:</span><br><span class="summary-value">' + papersStr + '</span></div>' +
            '<div><span class="summary-label">Опції:</span><br><span class="summary-value">' + optionsStr + '</span></div>' +
            '<div><span class="summary-label">ВСЬОГО:</span><br><span class="summary-value" style="font-size:13px;">' + orderSummary.totalPhotos + ' шт.</span></div>' +
            '</div></div>' +
            '<div class="total-row"><span>Сума:</span><span>' + order.totalAmount.toFixed(2) + ' грн</span></div>' +
            '<script>window.onload=function(){window.print();}</script>' +
            '</body>' +
            '</html>';

        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto relative">
            {/* Gallery Modal */}
            {previewIndex !== null && allImages[previewIndex] && (
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={() => setPreviewIndex(null)}>
                    {/* Top Bar */}
                    <div className="shrink-0 p-4 flex justify-between items-center text-white/80 bg-gradient-to-b from-black/50 to-transparent">
                        <div className="text-sm font-medium">
                            {previewIndex + 1} / {allImages.length}
                        </div>
                        <button onClick={() => setPreviewIndex(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-8 h-8 text-white" />
                        </button>
                    </div>

                    {/* Main Image */}
                    <div className="flex-1 min-h-0 w-full flex items-center justify-center relative px-2 md:px-12" onClick={(e) => e.stopPropagation()}>

                        {/* Prev Arrow */}
                        <button
                            className="absolute left-2 md:left-4 z-10 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPreviewIndex(prev => (prev! > 0 ? prev! - 1 : allImages.length - 1));
                            }}
                        >
                            <ArrowLeft className="w-8 h-8 md:w-10 md:h-10" />
                        </button>

                        <img
                            src={allImages[previewIndex].src}
                            alt="Preview"
                            className="max-w-full max-h-[calc(100vh-200px)] object-contain shadow-2xl rounded-lg"
                        />

                        {/* Next Arrow */}
                        <button
                            className="absolute right-2 md:right-4 z-10 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPreviewIndex(prev => (prev! < allImages.length - 1 ? prev! + 1 : 0));
                            }}
                        >
                            <ArrowLeft className="w-8 h-8 md:w-10 md:h-10 rotate-180" />
                        </button>
                    </div>

                    {/* Bottom Info Bar */}
                    <div className="shrink-0 w-full bg-slate-900/95 text-white p-4 md:p-5 backdrop-blur-md border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-sm">
                            <div>
                                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Файл</div>
                                <div className="font-medium truncate" title={allImages[previewIndex].originalName}>
                                    {allImages[previewIndex].originalName}
                                </div>
                            </div>
                            <div>
                                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Параметри</div>
                                <div className="font-medium">
                                    {allImages[previewIndex].size} • {t(allImages[previewIndex].paper)}
                                </div>
                            </div>
                            <div>
                                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Тираж</div>
                                <div className="font-medium">
                                    {allImages[previewIndex].quantity} шт.
                                </div>
                            </div>
                            <div className="flex items-center justify-end">
                                <a
                                    href={allImages[previewIndex].src}
                                    download={allImages[previewIndex].originalName.replace(/\.[^/.]+$/, "") + ".jpg"}
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Завантажити JPG</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <Link href="/fujiadmin/orders">
                        <Button variant="outline" size="sm" className="gap-2">
                            <ArrowLeft className="w-4 h-4" /> {t('admin.back_to_orders')}
                        </Button>
                    </Link>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900">{t('admin.order_number')} #{order.orderNumber}</h1>
                            <select
                                value={currentStatus}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={isUpdatingStatus}
                                className={`text-xs md:text-sm font-medium px-2 md:px-3 py-1 rounded-full uppercase tracking-wide border-0 cursor-pointer ${STATUS_COLORS[currentStatus]?.bg || 'bg-yellow-100'} ${STATUS_COLORS[currentStatus]?.text || 'text-yellow-800'}`}
                            >
                                <option value="DRAFT" className="bg-slate-100 text-slate-600">{t('admin.status.draft')}</option>
                                <option value="PENDING" className="bg-red-100 text-red-700">{t('admin.status.pending')}</option>
                                <option value="PROCESSING" className="bg-orange-100 text-orange-700">{t('admin.status.processing')}</option>
                                <option value="COMPLETED" className="bg-green-100 text-green-700">{t('admin.status.completed')}</option>
                                <option value="CANCELLED" className="bg-gray-200 text-gray-600">{t('admin.status.cancelled')}</option>
                            </select>
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                            {new Date(order.createdAt).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 relative">
                    <div className="relative">
                        <Button onClick={handleDownloadAll} className="gap-2 bg-blue-600 hover:bg-blue-700 text-xs md:text-sm">
                            <Archive className="w-4 h-4" />
                            <span className="hidden sm:inline">
                                {partsInfo && partsInfo.totalParts > 1 ? (
                                    <>
                                        {t('Download Archive')} ({partsInfo.totalParts} {partsInfo.totalParts === 1 ? 'часть' : 'частей'})
                                        <ChevronDown className="w-4 h-4 ml-1" />
                                    </>
                                ) : (
                                    t('Download Archive')
                                )}
                            </span>
                            <span className="sm:hidden">ZIP</span>
                        </Button>
                        {showPartsDropdown && partsInfo && partsInfo.totalParts > 1 && (
                            <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[250px]">
                                <div className="p-3 border-b border-slate-100">
                                    <p className="text-sm font-medium text-slate-700">
                                        Всего файлов: {partsInfo.totalFiles}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Разбито на {partsInfo.totalParts} частей по {partsInfo.photosPerPart} фото
                                    </p>
                                </div>
                                <div className="py-1">
                                    {partsInfo.parts.map((part) => (
                                        <button
                                            key={part.part}
                                            onClick={() => handleDownloadPart(part.part)}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between"
                                        >
                                            <span>Часть {part.part}</span>
                                            <span className="text-slate-400 text-xs">
                                                фото {part.from}–{part.to}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <Button onClick={handlePrint} variant="outline" className="gap-2 text-xs md:text-sm">
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('Print')}</span>
                    </Button>

                    {order.deliveryMethod === 'novaposhta' && !orderTTN && (
                        <Button onClick={() => setShowTTNModal(true)} className="gap-2 bg-orange-600 hover:bg-orange-700 text-xs md:text-sm">
                            <PackageCheck className="w-4 h-4" />
                            <span>{t('admin.create_ttn')}</span>
                        </Button>
                    )}
                    {orderTTN && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg shadow-sm">
                                <PackageCheck className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-bold text-green-700">ТТН: {orderTTN}</span>
                                <a
                                    href={`https://novaposhta.ua/tracking/?cargo_number=${orderTTN}`}
                                    target="_blank"
                                    className="text-[10px] text-blue-600 underline ml-1 hover:text-blue-800"
                                >
                                    Відстежити
                                </a>
                                <button
                                    onClick={handleCancelTTN}
                                    className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Скасувати ТТН"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="flex gap-1">
                                <a
                                    href={`/api/fujiadmin/orders/${order.id}/ttn/print?type=document`}
                                    target="_blank"
                                >
                                    <Button variant="outline" size="sm" className="h-9 gap-2 text-xs border-blue-200 hover:bg-blue-50">
                                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                                        <span>ТТН (PDF)</span>
                                    </Button>
                                </a>
                                <a
                                    href={`/api/fujiadmin/orders/${order.id}/ttn/print?type=marking`}
                                    target="_blank"
                                >
                                    <Button variant="outline" size="sm" className="h-9 gap-2 text-xs border-orange-200 hover:bg-orange-50">
                                        <Printer className="w-3.5 h-3.5 text-orange-600" />
                                        <span>Стікер (100x100)</span>
                                    </Button>
                                </a>
                            </div>
                        </div>
                    )}

                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-2 text-xs md:text-sm">
                        {isDeleting ? t('admin.deleting') : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('Delete Order')}</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-slate-900">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <User className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-lg">{t('admin.customer_info')}</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 text-sm">
                            <span className="text-slate-500">{t('admin.customer')}:</span>
                            <span className="col-span-2 font-medium">{order.customerName}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                            <span className="text-slate-500">{t('admin.phone')}:</span>
                            <span className="col-span-2 font-medium">{order.customerPhone}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                            <span className="text-slate-500">{t('admin.email')}:</span>
                            <span className="col-span-2 font-medium">{order.customerEmail || "-"}</span>
                        </div>
                    </div>
                </div>

                {/* Shipping Info */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-slate-900">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <Truck className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-lg">{t('admin.shipping_details')}</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 text-sm">
                            <span className="text-slate-500">{t('admin.method')}:</span>
                            <span className="col-span-2 font-medium">
                                {order.deliveryMethod === 'pickup' || order.deliveryMethod === 'PICKUP'
                                    ? t('checkout.pickup')
                                    : order.deliveryMethod === 'local'
                                        ? t('checkout.local')
                                        : order.deliveryMethod === 'novaposhta'
                                            ? t('checkout.novaposhta')
                                            : order.deliveryMethod}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                            <span className="text-slate-500">Вартість доставки:</span>
                            <span className="col-span-2 font-medium">{deliveryCostDisplay}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                            <span className="text-slate-500">{t('admin.address_branch')}:</span>
                            <span className="col-span-2 font-medium">{order.deliveryAddress || "-"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gift / Notes Section - PROMINENT */}
            {order.notes && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-100 p-6 rounded-xl border-2 border-green-400 shadow-lg">
                    <div className="flex items-center gap-3 mb-4 text-green-800">
                        <div className="p-2 bg-green-500 rounded-lg text-white">
                            <Gift className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-xl uppercase tracking-tight">🎁 ПОДАРУНОК / ПРИМІТКИ</h3>
                    </div>
                    <div className="bg-white/80 p-4 rounded-lg border border-green-300">
                        <pre className="whitespace-pre-wrap text-lg font-medium text-green-900">{order.notes}</pre>
                    </div>
                </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-lg text-slate-900">{t('admin.items')} ({order.items.length})</h3>
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                        {t('admin.total')}: {order.totalAmount.toFixed(2)} {t('general.currency')}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[600px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th className="px-3 md:px-6 py-3 w-20">{t('admin.preview')}</th>
                                <th className="px-3 md:px-6 py-3">{t('admin.file_info')}</th>
                                <th className="px-3 md:px-6 py-3">{t('admin.print_options')}</th>
                                <th className="px-3 md:px-6 py-3 text-right">{t('admin.action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order.items.slice(0, itemsToShow).map((item: any, itemIndex: number) => {
                                const files = getFilesFromItem(item);
                                const firstFile = files[0];

                                // Calculate global index for first file of this item
                                const startGlobalIndex = allImages.findIndex(img => img.itemIndex === itemIndex && img.fileIndexInItem === 0);

                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-3 md:px-6 py-4">
                                            {(() => {
                                                const fileName = firstFile?.original || firstFile?.server || "";
                                                const isArchive = /\.(zip|rar|7z)$/i.test(fileName);

                                                if (isArchive) {
                                                    return (
                                                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                            <Archive className="w-6 h-6 md:w-8 md:h-8 text-slate-400" />
                                                        </div>
                                                    );
                                                }

                                                return firstFile ? (
                                                    <div
                                                        className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative cursor-pointer group"
                                                        onClick={() => setPreviewIndex(startGlobalIndex !== -1 ? startGlobalIndex : null)}
                                                    >
                                                        <img
                                                            src={`/api/uploads/${firstFile.server}`}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                        {files.length > 1 && (
                                                            <div className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[10px] px-1 rounded-tl">
                                                                +{files.length - 1}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                        <FileImage className="w-6 h-6 md:w-8 md:h-8 text-slate-300" />
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-3 md:px-6 py-4">
                                            <div className="font-medium text-slate-900 truncate max-w-[120px] md:max-w-[200px]" title={firstFile?.original || item.fileName || "Unknown"}>
                                                {firstFile?.original || item.fileName || "photo.jpg"}
                                            </div>
                                            {firstFile && (
                                                <div className="text-xs text-slate-400 font-mono mt-1 truncate max-w-[120px] md:max-w-[200px]">
                                                    {firstFile.server}
                                                </div>
                                            )}
                                            {files.length > 1 && (
                                                <div className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline" onClick={() => setPreviewIndex(startGlobalIndex)}>
                                                    Дивитись всі {files.length} шт.
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 md:px-6 py-4">
                                            {(() => {
                                                const fileName = firstFile?.original || firstFile?.server || "";
                                                const isArchive = /\.(zip|rar|7z)$/i.test(fileName);

                                                if (isArchive) {
                                                    return (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700 uppercase tracking-wide">
                                                            АРХІВ
                                                        </span>
                                                    );
                                                }

                                                return (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-slate-700 text-xs md:text-sm">
                                                            {item.options?.size || item.size} • {t(item.options?.paper || item.paper)}
                                                        </span>
                                                        <span className="text-slate-500 text-xs">
                                                            {t('Quantity')}: <span className="font-medium text-slate-900">{item.options?.quantity || 1}</span>
                                                        </span>
                                                        <div className="flex gap-1 md:gap-2 mt-1 flex-wrap">
                                                            {item.options?.options?.magnetic && (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">
                                                                    {t('badge.mag')}
                                                                </span>
                                                            )}
                                                            {item.options?.options?.border && (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">
                                                                    {t('badge.border')}
                                                                </span>
                                                            )}
                                                            {item.options?.options?.cropping === 'fit' && (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide shadow-sm border border-indigo-200">
                                                                    FIT-IN
                                                                </span>
                                                            )}
                                                            {item.options?.options?.cropping === 'no_resize' && (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide shadow-sm border border-purple-200">
                                                                    NO-RESIZE
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-3 md:px-6 py-4 text-right">
                                            {firstFile && (
                                                <a
                                                    href={`/api/uploads/${firstFile.server}`}
                                                    download={(() => {
                                                        const fileName = firstFile.original || 'file';
                                                        const isArchive = /\.(zip|rar|7z)$/i.test(fileName);
                                                        if (isArchive) return fileName;
                                                        return fileName.replace(/\.[^/.]+$/, "") + ".jpg";
                                                    })()}
                                                    target="_blank"
                                                    className="inline-flex items-center justify-center px-2 md:px-4 py-2 border border-slate-200 shadow-sm text-xs md:text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                                >
                                                    <Download className="w-4 h-4 md:mr-2" />
                                                    <span className="hidden md:inline">
                                                        {t('admin.download')}
                                                        {/\.(zip|rar|7z)$/i.test(firstFile.original || "") ? "" : " (JPG)"}
                                                    </span>
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Show more button for pagination */}
                {order.items.length > itemsToShow && (
                    <div className="p-4 border-t border-slate-100 text-center">
                        <Button
                            variant="outline"
                            onClick={() => setItemsToShow(prev => prev + ITEMS_PER_PAGE)}
                            className="gap-2"
                        >
                            Показать ещё {Math.min(ITEMS_PER_PAGE, order.items.length - itemsToShow)} из {order.items.length - itemsToShow} оставшихся
                        </Button>
                    </div>
                )}
                {/* Progress indicator */}
                {order.items.length > 50 && (
                    <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-sm text-slate-500">
                        Показано {Math.min(itemsToShow, order.items.length)} из {order.items.length} фотографий
                    </div>
                )}
            </div>

            {showTTNModal && (
                <TTNModal
                    order={order}
                    onClose={() => setShowTTNModal(false)}
                    onSuccess={(ttn) => {
                        setOrderTTN(ttn);
                        setShowTTNModal(false);
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}
