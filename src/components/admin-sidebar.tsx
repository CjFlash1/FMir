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
    HelpCircle,
    Menu,
    X
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useState, useCallback, useEffect } from "react";

export function AdminSidebar() {
    const pathname = usePathname();
    const { t } = useTranslation();
    const [width, setWidth] = useState(260);
    const [isResizing, setIsResizing] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Hydration fix
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const startResizing = useCallback(() => {
        if (window.innerWidth >= 768) setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => setIsResizing(false), []);

    const resize = useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isResizing && window.innerWidth >= 768) {
                const newWidth = mouseMoveEvent.clientX;
                if (newWidth > 64 && newWidth < 400) {
                    setWidth(newWidth);
                }
            }
        },
        [isResizing]
    );

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
        } else {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        }
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    const navigation = [
        { name: t("admin.dashboard"), href: "/fujiadmin", icon: LayoutDashboard },
        { name: t("admin.orders"), href: "/fujiadmin/orders", icon: ShoppingBag },
        { name: t("admin.content"), href: "/fujiadmin/content", icon: Image },
        { name: t("admin.users"), href: "/fujiadmin/users", icon: Users },
        { name: t("admin.help", "Help Center"), href: "/fujiadmin/help", icon: HelpCircle },
        { name: t("admin.pages"), href: "/fujiadmin/pages", icon: FileText },
        { name: t("admin.translations"), href: "/fujiadmin/config/translations", icon: Globe },
        { name: t("admin.settings"), href: "/fujiadmin/settings", icon: Settings },
        { name: t("admin.config"), href: "/fujiadmin/config/discounts", icon: Settings },
    ];

    // Listen for resize to close mobile menu on desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            {/* Mobile Header Bar - Visible only on mobile via CSS */}
            <div className={`fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center gap-3 shadow-lg md:hidden ${isMobileOpen ? 'hidden' : ''}`}>
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    aria-label="Open Menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold tracking-tight">Fujimir Admin</span>
            </div>

            {/* Mobile Overlay */}
            {mounted && isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "flex flex-col gap-y-5 overflow-y-auto bg-slate-900 px-4 pb-4 text-white shrink-0 transition-transform duration-200",
                    // Mobile: Fixed, slide-in
                    "fixed inset-y-0 left-0 z-50 w-64",
                    // Desktop: Relative, always visible, reset transform
                    "md:relative md:translate-x-0 md:min-h-screen md:z-auto",
                    // Toggle logic for mobile (only applies if not overriden by md:translate-x-0)
                    (!isMobileOpen ? "-translate-x-full md:translate-x-0" : "translate-x-0")
                )}
                style={mounted ? { width: window.innerWidth >= 768 ? width : undefined } : undefined}
            >
                {/* Close button for mobile */}
                <div className="flex md:hidden h-14 shrink-0 items-center justify-between overflow-hidden whitespace-nowrap">
                    <span className="text-lg font-bold tracking-tight">Fujimir Admin</span>
                    <button onClick={() => setIsMobileOpen(false)} className="p-2 text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Desktop Header (hidden on mobile) */}
                <div className="hidden md:flex h-14 shrink-0 items-center justify-between overflow-hidden whitespace-nowrap">
                    <span className="text-lg font-bold tracking-tight">Fujimir Admin</span>
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
                                                onClick={() => setIsMobileOpen(false)}
                                                className={cn(
                                                    isActive
                                                        ? "bg-slate-800 text-white"
                                                        : "text-slate-400 hover:bg-slate-800 hover:text-white",
                                                    "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 whitespace-nowrap overflow-hidden"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                                <span className="truncate">{item.name}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </li>
                        <li className="mt-auto">
                            <Link
                                href="/"
                                className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-slate-400 hover:bg-slate-800 hover:text-white whitespace-nowrap overflow-hidden"
                            >
                                <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                                {t('admin.signout')}
                            </Link>
                        </li>
                    </ul>
                </nav>

                {/* Resize Handle - Desktop only */}
                <div
                    onMouseDown={startResizing}
                    className={`hidden md:block absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-500 transition-colors z-30 ${isResizing ? 'bg-primary-600 w-1.5' : 'bg-slate-800/50'}`}
                />
            </aside>
        </>
    );
}
