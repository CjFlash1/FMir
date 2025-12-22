"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Settings,
    Image,
    FileText,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/fujiadmin", icon: LayoutDashboard },
    { name: "Orders", href: "/fujiadmin/orders", icon: ShoppingBag },
    { name: "Media / Content", href: "/fujiadmin/content", icon: Image },
    { name: "Users", href: "/fujiadmin/users", icon: Users },
    { name: "Pages", href: "/fujiadmin/pages", icon: FileText },
    { name: "Global Settings", href: "/fujiadmin/settings", icon: Settings },
    { name: "System Config", href: "/fujiadmin/config/sizes", icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 px-6 pb-4 w-64 min-h-screen text-white">
            <div className="flex h-16 shrink-0 items-center">
                <span className="text-xl font-bold tracking-tight">Fujimir Admin</span>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                isActive
                                                    ? "bg-slate-800 text-white"
                                                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                                                "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                                            )}
                                        >
                                            <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                            {item.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </li>
                    <li className="mt-auto">
                        <Link
                            href="/"
                            className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-slate-400 hover:bg-slate-800 hover:text-white"
                        >
                            <LogOut className="h-6 w-6 shrink-0" aria-hidden="true" />
                            Sign Out / Main Site
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
