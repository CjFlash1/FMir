"use client";

import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrdersTableProps {
    orders: any[];
}

const ORDERS_PER_PAGE = 20;

// Status color mapping
const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT: { bg: "bg-slate-100", text: "text-slate-600", label: "admin.status.draft" },
    PENDING: { bg: "bg-red-100", text: "text-red-700", label: "admin.status.pending" },
    PROCESSING: { bg: "bg-orange-100", text: "text-orange-700", label: "admin.status.processing" },
    COMPLETED: { bg: "bg-green-100", text: "text-green-700", label: "admin.status.completed" },
    CANCELLED: { bg: "bg-gray-200", text: "text-gray-600", label: "admin.status.cancelled" },
};

const STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"];

export function OrdersTable({ orders }: OrdersTableProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Pagination calculations
    const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    const paginatedOrders = orders.slice(startIndex, startIndex + ORDERS_PER_PAGE);

    const toggleSelectAll = () => {
        if (selectedOrders.size === paginatedOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(paginatedOrders.map(o => o.id)));
        }
    };

    const toggleSelect = (id: number) => {
        const newSelected = new Set(selectedOrders);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedOrders(newSelected);
    };

    const handleBulkStatusChange = async (newStatus: string) => {
        if (selectedOrders.size === 0) return;

        setIsUpdatingStatus(true);
        try {
            const res = await fetch("/api/fujiadmin/orders/bulk-status", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderIds: Array.from(selectedOrders),
                    status: newStatus
                })
            });

            if (res.ok) {
                router.refresh();
                setSelectedOrders(new Set());
            } else {
                alert(t("admin.status_update_failed"));
            }
        } catch (error) {
            console.error("Bulk status update failed", error);
            alert(t("admin.status_update_failed"));
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(t('Are you sure you want to delete selected orders?'))) return;
        setIsDeleting(true);
        try {
            const results = await Promise.all(
                Array.from(selectedOrders).map(async id => {
                    const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
                    return res.ok;
                })
            );

            const failedCount = results.filter(r => !r).length;
            if (failedCount > 0) {
                alert(`Failed to delete ${failedCount} orders.`);
            }
            router.refresh();
            setSelectedOrders(new Set());
        } catch (error) {
            console.error("Bulk delete failed", error);
            alert("Some orders failed to delete");
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusStyle = (status: string) => {
        return STATUS_COLORS[status] || STATUS_COLORS.PENDING;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('admin.orders')}</h1>

                {selectedOrders.size > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-slate-600 mr-2">
                            {t('admin.selected')}: {selectedOrders.size}
                        </span>

                        {/* Status change buttons */}
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                            {STATUSES.map(status => {
                                const style = getStatusStyle(status);
                                return (
                                    <button
                                        key={status}
                                        onClick={() => handleBulkStatusChange(status)}
                                        disabled={isUpdatingStatus}
                                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${style.bg} ${style.text} hover:opacity-80 disabled:opacity-50`}
                                    >
                                        {t(style.label)}
                                    </button>
                                );
                            })}
                        </div>

                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="gap-1"
                        >
                            <Trash2 className="w-4 h-4" />
                            {t('bulk.delete')}
                        </Button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300"
                                        checked={paginatedOrders.length > 0 && selectedOrders.size === paginatedOrders.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-3">{t('admin.order_number')}</th>
                                <th className="px-6 py-3">{t('admin.date')}</th>
                                <th className="px-6 py-3">{t('admin.customer')}</th>
                                <th className="px-6 py-3">{t('admin.method')}</th>
                                <th className="px-6 py-3">{t('admin.items')}</th>
                                <th className="px-6 py-3">{t('admin.total')}</th>
                                <th className="px-6 py-3">{t('admin.status')}</th>
                                <th className="px-6 py-3">{t('admin.action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                                        {t('No orders found')}
                                    </td>
                                </tr>
                            ) : (
                                paginatedOrders.map((order) => {
                                    const statusStyle = getStatusStyle(order.status);
                                    return (
                                        <tr key={order.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300"
                                                    checked={selectedOrders.has(order.id)}
                                                    onChange={() => toggleSelect(order.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{order.orderNumber}</td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{order.customerName || "—"}</div>
                                                <div className="text-xs text-slate-500">{order.customerPhone || "—"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.deliveryMethod === 'PICKUP' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {order.deliveryMethod}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{order._count?.items || 0}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{order.totalAmount?.toFixed(2) || "0.00"} {t('general.currency')}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                                    {t(statusStyle.label)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link href={`/fujiadmin/orders/${order.id}`} className="text-primary-600 hover:text-primary-900 font-medium hover:underline">
                                                    {t('admin.view')}
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            {t('admin.showing')} {startIndex + 1}–{Math.min(startIndex + ORDERS_PER_PAGE, orders.length)} {t('admin.of')} {orders.length}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="gap-1"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                {t('admin.prev')}
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 text-sm font-medium rounded ${currentPage === pageNum
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="gap-1"
                            >
                                {t('admin.next')}
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
