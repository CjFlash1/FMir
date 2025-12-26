"use client";

import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import { ArrowLeft, Download, FileImage, CreditCard, Truck, User, Trash2, Archive, X, ChevronDown, Gift, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

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
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [partsInfo, setPartsInfo] = useState<PartsInfo | null>(null);
    const [showPartsDropdown, setShowPartsDropdown] = useState(false);
    const [itemsToShow, setItemsToShow] = useState(50); // Pagination for items
    const ITEMS_PER_PAGE = 50;

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
            } else {
                alert('Failed to delete order');
            }
        } catch (error) {
            console.error(error);
            alert('Error deleting order');
        } finally {
            setIsDeleting(false);
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

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        const sizesStr = Object.entries(orderSummary.sizes).map(([s, c]) => s + ': ' + c).join(', ');
        const papersStr = Object.entries(orderSummary.papers).map(([p, c]) => p + ': ' + c).join(', ');
        const optionsArr: string[] = [];
        if (orderSummary.magnets > 0) optionsArr.push('Магн: ' + orderSummary.magnets);
        if (orderSummary.borders > 0) optionsArr.push('Борд: ' + orderSummary.borders);
        const optionsStr = optionsArr.length > 0 ? optionsArr.join(', ') : '-';

        const deliveryMethodDisplay = order.deliveryMethod === 'PICKUP' ? 'Самовивіз' : order.deliveryMethod;

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
            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-slate-300"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                    />
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-4">
                    <Link href="/fujiadmin/orders">
                        <Button variant="outline" size="sm" className="gap-2">
                            <ArrowLeft className="w-4 h-4" /> {t('admin.back_to_orders')}
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">{t('admin.order_number')} #{order.orderNumber}</h1>
                            <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full uppercase tracking-wide">
                                {t(order.status)}
                            </span>
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                            {new Date(order.createdAt).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 relative">
                    <div className="relative">
                        <Button onClick={handleDownloadAll} className="gap-2 bg-blue-600 hover:bg-blue-700">
                            <Archive className="w-4 h-4" />
                            {partsInfo && partsInfo.totalParts > 1 ? (
                                <>
                                    {t('Download Archive')} ({partsInfo.totalParts} {partsInfo.totalParts === 1 ? 'часть' : 'частей'})
                                    <ChevronDown className="w-4 h-4 ml-1" />
                                </>
                            ) : (
                                t('Download Archive')
                            )}
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
                    <Button onClick={handlePrint} variant="outline" className="gap-2">
                        <Printer className="w-4 h-4" />
                        {t('Print')}
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-2">
                        {isDeleting ? t('admin.deleting') : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                {t('Delete Order')}
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
                                {order.deliveryMethod === 'PICKUP' ? t('checkout.pickup') : t('checkout.novaposhta')}
                            </span>
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
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
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
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th className="px-6 py-3 w-20">{t('admin.preview')}</th>
                                <th className="px-6 py-3">{t('admin.file_info')}</th>
                                <th className="px-6 py-3">{t('admin.print_options')}</th>
                                <th className="px-6 py-3 text-right">{t('admin.action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order.items.slice(0, itemsToShow).map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        {item.serverFileName ? (
                                            <div
                                                className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative cursor-pointer group"
                                                onClick={() => setPreviewImage(`/uploads/${item.serverFileName}`)}
                                            >
                                                <img
                                                    src={`/uploads/${item.serverFileName}`}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                <FileImage className="w-8 h-8 text-slate-300" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900 truncate max-w-[200px]" title={item.fileName || "Unknown"}>
                                            {item.fileName || "photo.jpg"}
                                        </div>
                                        {item.serverFileName && (
                                            <div className="text-xs text-slate-400 font-mono mt-1 truncate max-w-[200px]">
                                                {item.serverFileName}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-slate-700">
                                                {item.options.size} • {t(item.options.paper)}
                                            </span>
                                            <span className="text-slate-500">
                                                {t('Quantity')}: <span className="font-medium text-slate-900">{item.options.quantity}</span>
                                            </span>
                                            <div className="flex gap-2 mt-1">
                                                {item.options.options?.magnetic && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">
                                                        {t('badge.mag')}
                                                    </span>
                                                )}
                                                {item.options.options?.border && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">
                                                        {t('badge.border')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {item.serverFileName && (
                                            <a
                                                href={`/uploads/${item.serverFileName}`}
                                                download={item.fileName ? item.fileName.replace(/\.[^.]+$/, '') + '.jpg' : 'photo.jpg'}
                                                target="_blank"
                                                className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                {t('admin.download')}
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
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
        </div>
    );
}
