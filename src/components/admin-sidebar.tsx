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
    LogOut,
    Globe,
    HelpCircle
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
    const pathname = usePathname();
    const { t } = useTranslation();

    const navigation = [
        { name: t("admin.dashboard"), href: "/fujiadmin", icon: LayoutDashboard },
        { name: t("admin.orders"), href: "/fujiadmin/orders", icon: ShoppingBag },
        { name: t("admin.content"), href: "/fujiadmin/content", icon: Image },
        { name: t("admin.users"), href: "/fujiadmin/users", icon: Users },
        { name: t("admin.help", "Help Center"), href: "/fujiadmin/help", icon: HelpCircle },
        { name: t("admin.pages"), href: "/fujiadmin/pages", icon: FileText },
        { name: t("admin.translations"), href: "/fujiadmin/config/translations", icon: Globe },
        { name: t("admin.settings"), href: "/fujiadmin/settings", icon: Settings },
        { name: t("admin.config"), href: "/fujiadmin/config/sizes", icon: Settings },
    ];

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
