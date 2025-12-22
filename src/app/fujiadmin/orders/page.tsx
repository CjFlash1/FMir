import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { items: true } } }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Orders</h1>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Order #</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Method</th>
                                <th className="px-6 py-3">Items</th>
                                <th className="px-6 py-3">Total</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{order.orderNumber}</td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{order.customerName}</div>
                                            <div className="text-xs text-slate-500">{order.customerPhone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.deliveryMethod === 'PICKUP' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                {order.deliveryMethod}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{order._count.items} photos</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{order.totalAmount.toFixed(2)} ₴</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-primary-600 hover:text-primary-900 font-medium hover:underline">
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
