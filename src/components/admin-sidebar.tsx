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
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setIsMobileOpen(false);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const startResizing = useCallback(() => {
        if (!isMobile) setIsResizing(true);
    }, [isMobile]);
    const stopResizing = useCallback(() => setIsResizing(false), []);

    const resize = useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isResizing && !isMobile) {
                const newWidth = mouseMoveEvent.clientX;
                if (newWidth > 64 && newWidth < 400) {
                    setWidth(newWidth);
                }
            }
        },
        [isResizing, isMobile]
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

    const handleNavClick = () => {
        if (isMobile) {
            setIsMobileOpen(false);
        }
    };

    const SidebarContent = () => (
        <>
            <div className="flex h-14 shrink-0 items-center justify-between overflow-hidden whitespace-nowrap">
                <span className="text-lg font-bold tracking-tight">Fujimir Admin</span>
                {isMobile && (
                    <button onClick={() => setIsMobileOpen(false)} className="p-2 text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                )}
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
                                            onClick={handleNavClick}
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
                            onClick={handleNavClick}
                            className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-slate-400 hover:bg-slate-800 hover:text-white whitespace-nowrap overflow-hidden"
                        >
                            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                            {t('admin.signout')}
                        </Link>
                    </li>
                </ul>
            </nav>
        </>
    );

    return (
        <>
            {/* Mobile Menu Button - Fixed at top */}
            {isMobile && !isMobileOpen && (
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg md:hidden"
                >
                    <Menu className="w-6 h-6" />
                </button>
            )}

            {/* Mobile Overlay */}
            {isMobile && isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar - Desktop: fixed width, Mobile: overlay */}
            <div
                className={cn(
                    "flex flex-col gap-y-5 overflow-y-auto bg-slate-900 px-4 pb-4 text-white shrink-0 transition-transform duration-200",
                    isMobile
                        ? `fixed inset-y-0 left-0 z-50 w-64 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`
                        : "relative min-h-screen"
                )}
                style={isMobile ? undefined : { width: width }}
            >
                <SidebarContent />

                {/* Resize Handle - Desktop only */}
                {!isMobile && (
                    <div
                        onMouseDown={startResizing}
                        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-500 transition-colors z-30 ${isResizing ? 'bg-primary-600 w-1.5' : 'bg-slate-800/50'}`}
                    />
                )}
            </div>
        </>
    );
}
