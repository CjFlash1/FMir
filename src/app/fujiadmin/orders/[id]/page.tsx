import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, User, Phone, Mail, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
    const order = await prisma.order.findUnique({
        where: { id: parseInt(params.id) },
        include: { items: true }
    });

    if (!order) notFound();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/fujiadmin/orders">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    Order #{order.orderNumber}
                </h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-500">Status:</span>
                    <select
                        defaultValue={order.status}
                        className="text-sm font-medium px-3 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onChange={async (e) => {
                            "use client";
                            await fetch(`/api/fujiadmin/orders/${order.id}/status`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: e.target.value })
                            });
                            window.location.reload();
                        }}
                    >
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Customer Details */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-900">Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                                <div className="font-medium text-slate-900">{order.customerName}</div>
                                <div className="text-xs text-slate-500 font-medium">Customer</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-slate-400" />
                            <div className="text-sm text-slate-600 font-medium">{order.customerPhone}</div>
                        </div>
                        {order.customerEmail && (
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-slate-400" />
                                <div className="text-sm text-slate-600 font-medium">{order.customerEmail}</div>
                            </div>
                        )}
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                                <div className="text-sm font-semibold text-slate-900">{order.deliveryMethod}</div>
                                <div className="text-xs text-slate-500 font-medium">{order.deliveryAddress || "Self-pickup"}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items List */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                                <Package className="w-5 h-5 text-primary-600" />
                                Order Items ({order.items.length})
                            </CardTitle>
                            <a href={`/api/orders/${order.id}/zip`} download>
                                <Button size="sm" className="gap-2 bg-primary-600 hover:bg-primary-700">
                                    <Download className="w-4 h-4" /> Download ZIP
                                </Button>
                            </a>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y divide-slate-100">
                                {order.items.map((item: any) => {
                                    const options = JSON.parse(item.options || "{}");
                                    const files = JSON.parse(item.files || "[]");
                                    const firstFile = files[0]?.server || files[0];

                                    return (
                                        <div key={item.id} className="py-4 flex gap-4 items-center">
                                            {firstFile && (
                                                <div className="w-16 h-16 rounded bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                                    <img
                                                        src={`/uploads/${firstFile}`}
                                                        alt="preview"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-900">{item.name}</div>
                                                <div className="text-xs text-slate-500 mt-1 flex gap-2 font-medium">
                                                    <span>Size: {item.size}</span>
                                                    <span>Paper: {item.paper}</span>
                                                    {Object.entries(options).filter(([_, v]) => v).map(([k]) => (
                                                        <span key={k} className="text-primary-600">+{k}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium text-slate-900">{item.price.toFixed(2)} ₴ x {item.quantity}</div>
                                                <div className="text-sm font-bold text-primary-600">{item.subtotal.toFixed(2)} ₴</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
                                <div className="text-right">
                                    <div className="text-sm text-slate-500 font-medium">Order Total</div>
                                    <div className="text-2xl font-bold text-slate-900">{order.totalAmount.toFixed(2)} ₴</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
