"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Camera } from "lucide-react";
import { Button } from "./ui/button";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { t, lang, setLang } = useTranslation();
    const { getSetting } = useSettings();

    const navLinks = [
        { href: "/upload", label: t('nav.upload'), primary: true },
        { href: "/pricing", label: t('nav.pricing') },
        { href: "/p/about", label: t('nav.about') },
        { href: "/p/contact", label: t('nav.contact') },
        { href: "/p/help", label: t('nav.help') },
    ];

    // localized labels
    const labels: Record<string, { address: string, contact: string }> = {
        uk: { address: 'Адреса', contact: 'Зв\'яжіться з нами' },
        ru: { address: 'Адрес', contact: 'Свяжитесь с нами' },
        en: { address: 'Address', contact: 'Contact Us' }
    };
    const currentLabels = labels[lang as string] || labels.en;

    // Contact Data (Source: Original Site / Seed Data)
    const addresses: Record<string, string> = {
        uk: 'м. Дніпро, вул. Європейська 8',
        ru: 'г. Днепр, ул. Европейская 8',
        en: 'Dnipro, Yevropeyska St, 8'
    };
    const address = addresses[lang as string] || addresses.uk;
    const phone = '(099) 215-03-17'; // Primary phone

    // Google Maps Query
    const mapQuery = encodeURIComponent('м. Дніпро, вул. Європейська 8');
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

    // Logo Configuration
    const logoConfig: Record<string, { mainSuffix: string, subtitle: string }> = {
        uk: { mainSuffix: '.СВІТ', subtitle: 'онлайн фотолабораторія' },
        ru: { mainSuffix: '.MIR', subtitle: 'онлайн фотолаборатория' },
        en: { mainSuffix: '.MIR', subtitle: 'Online Photo Lab' }
    };
    const currentLogo = logoConfig[lang as string] || logoConfig.en;

    return (
        <nav className="sticky top-0 z-50 flex flex-col shadow-md font-sans">
            {/* Top Tier: Green Gradient Header */}
            <div className="bg-gradient-to-b from-[#00b352] to-[#009846] text-white py-2 md:py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    {/* Logo Area */}
                    <Link href="/" className="flex items-center gap-3 md:gap-4 group shrink-0">
                        <div className="transition-transform group-hover:scale-105">
                            <img src="/logo.png" alt="Fujimir" className="h-8 md:h-12 w-auto" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-xl md:text-3xl tracking-tighter leading-none whitespace-nowrap">
                                <span className="text-white">FUJI</span>
                                <span className="text-white/90 font-light">
                                    {currentLogo.mainSuffix}
                                </span>
                            </span>
                            <span className="text-[8px] md:text-[10px] text-white/80 uppercase tracking-[0.2em] font-bold mt-0.5 md:mt-1 hidden sm:block">
                                {currentLogo.subtitle}
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Contact & Socials */}
                    <div className="hidden lg:flex items-center gap-6 xl:gap-8">
                        {/* Address */}
                        <a href={mapLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group hover:opacity-90 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
                                <span className="text-xl">📍</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white/70 text-[10px] uppercase leading-none mb-1 font-bold">{currentLabels.address}</span>
                                <span className="leading-tight text-sm font-medium max-w-[150px] underline decoration-white/30 underline-offset-2 hover:decoration-white/80 transition-all">{address}</span>
                            </div>
                        </a>

                        {/* Phone */}
                        <div className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
                                <span className="text-xl">📞</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white/70 text-[10px] uppercase leading-none mb-1 font-bold">{currentLabels.contact}</span>
                                <span className="leading-tight text-lg font-bold whitespace-nowrap">{phone}</span>
                            </div>
                        </div>

                        {/* Social Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Viber */}
                            <a href={`viber://chat?number=${phone.replace(/\D/g, '')}`} className="w-10 h-10 rounded-full bg-[#7360f2] flex items-center justify-center hover:scale-110 transition-transform shadow-lg" title="Viber">
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M17.57 1.54C16.94.88 15.9 0 14.54 0c-1.37 0-1.8.88-2.54 2-1.12 1.63-.44 2.82-.44 2.82l1.39 1.34s-.45 1.5-1.54 3.19C10.32 10.95 9 12.06 9 12.06l-1.4-1.34s-1.19-.68-2.82.44c-1.12.75-2 1.18-2 2.54 0 1.36.88 2.4 1.54 3.03 2.14 2.14 5.75 3.39 9.38 3.39 4.3 0 7.31-2.12 9.38-4.22.66-.64 1.54-1.68 1.54-3.04 0-1.36-.88-1.79-2-2.54-1.63-1.12-2.82-.44-2.82-.44l-1.34 1.4s-1.5-.45-3.19-1.54c-1.61-1.04-2.73-2.35-2.73-2.35l1.34-1.39s.68-1.2-.44-2.83C12.35 1.74 11.9.89 10.54.89c-1.36 0-1.79.88-2.54 2-.75 1.12-1.18 2.54-1.18 2.54s0 1.94.89 3.88c.89 1.93 2.12 3.81 3.56 5.25 1.44 1.44 3.32 2.67 5.25 3.56 1.94.89 3.88.89 3.88.89s1.42-.43 2.54-1.18c1.12-.75 2-1.18 2-2.54s-.88-1.8-2-2.54l-2.82-1.39s-1.22-.44-.45 1.12c.75 1.63-.44 2.82-.44 2.82z" /></svg>
                            </a>
                            {/* Telegram */}
                            <a href={`https://t.me/+${phone.replace(/\D/g, '')}`} target="_blank" className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center hover:scale-110 transition-transform shadow-lg" title="Telegram">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.3.26-.54.26l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" /></svg>
                            </a>
                        </div>

                        {/* Lang */}
                        <div className="flex items-center gap-2 text-xs font-bold border-l border-white/20 pl-6 ml-2">
                            <button onClick={() => setLang('uk')} className={`transition-colors ${lang === 'uk' ? 'text-white' : 'text-white/50 hover:text-white'}`}>UA</button>
                            <button onClick={() => setLang('ru')} className={`transition-colors ${lang === 'ru' ? 'text-white' : 'text-white/50 hover:text-white'}`}>RU</button>
                            <button onClick={() => setLang('en')} className={`transition-colors ${lang === 'en' ? 'text-white' : 'text-white/50 hover:text-white'}`}>EN</button>
                        </div>
                    </div>

                    {/* Mobile Controls */}
                    <div className="flex items-center gap-4 lg:hidden">
                        {/* Mobile Socials (Visible on bar) */}
                        <div className="flex items-center gap-2">
                            <a href={`viber://chat?number=${phone.replace(/\D/g, '')}`} className="w-8 h-8 rounded-full bg-[#7360f2] flex items-center justify-center active:scale-95 transition-transform">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.57 1.54C16.94.88 15.9 0 14.54 0c-1.37 0-1.8.88-2.54 2-1.12 1.63-.44 2.82-.44 2.82l1.39 1.34s-.45 1.5-1.54 3.19C10.32 10.95 9 12.06 9 12.06l-1.4-1.34s-1.19-.68-2.82.44c-1.12.75-2 1.18-2 2.54 0 1.36.88 2.4 1.54 3.03 2.14 2.14 5.75 3.39 9.38 3.39 4.3 0 7.31-2.12 9.38-4.22.66-.64 1.54-1.68 1.54-3.04 0-1.36-.88-1.79-2-2.54-1.63-1.12-2.82-.44-2.82-.44l-1.34 1.4s-1.5-.45-3.19-1.54c-1.61-1.04-2.73-2.35-2.73-2.35l1.34-1.39s.68-1.2-.44-2.83C12.35 1.74 11.9.89 10.54.89c-1.36 0-1.79.88-2.54 2-.75 1.12-1.18 2.54-1.18 2.54s0 1.94.89 3.88c.89 1.93 2.12 3.81 3.56 5.25 1.44 1.44 3.32 2.67 5.25 3.56 1.94.89 3.88.89 3.88.89s1.42-.43 2.54-1.18c1.12-.75 2-1.18 2-2.54s-.88-1.8-2-2.54l-2.82-1.39s-1.22-.44-.45 1.12c.75 1.63-.44 2.82-.44 2.82z" /></svg>
                            </a>
                            <a href={`https://t.me/+${phone.replace(/\D/g, '')}`} className="w-8 h-8 rounded-full bg-[#0088cc] flex items-center justify-center active:scale-95 transition-transform">
                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.3.26-.54.26l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" /></svg>
                            </a>
                        </div>

                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 text-white hover:bg-white/10 rounded-md"
                        >
                            {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Tier: Tan Menu Bar */}
            <div className="bg-[#c5b98e] border-b border-[#a69269]/30 hidden md:block">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12">
                        <div className="flex space-x-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "px-6 h-12 flex items-center text-sm font-bold transition-all uppercase tracking-wide",
                                        link.primary
                                            ? "bg-[#e31e24] text-white hover:bg-[#c31a1f] shadow-inner"
                                            : "text-[#4c4c4c] hover:bg-[#a69269]/20 hover:text-black"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-[#f3f1e9] border-b border-tan-dark shadow-xl animate-in slide-in-from-top-2">
                    {/* Mobile Contact Info Block */}
                    <div className="px-4 py-4 bg-[#e8e4d3] border-b border-[#c5b98e] space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="text-xl">📍</span>
                            <div className="flex flex-col">
                                <span className="text-xs uppercase font-bold text-[#4c4c4c]/60">{currentLabels.address}</span>
                                <a href={mapLink} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#1a1a1a] underline decoration-black/20 underline-offset-2">{address}</a>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-xl">📞</span>
                            <div className="flex flex-col">
                                <span className="text-xs uppercase font-bold text-[#4c4c4c]/60">{currentLabels.contact}</span>
                                <a href={`tel:${phone}`} className="text-sm font-bold text-[#1a1a1a]">{phone}</a>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button onClick={() => setLang('uk')} className={`text-sm font-bold ${lang === 'uk' ? 'text-[#009846] underline' : 'text-[#4c4c4c]'}`}>UA</button>
                            <button onClick={() => setLang('ru')} className={`text-sm font-bold ${lang === 'ru' ? 'text-[#009846] underline' : 'text-[#4c4c4c]'}`}>RU</button>
                            <button onClick={() => setLang('en')} className={`text-sm font-bold ${lang === 'en' ? 'text-[#009846] underline' : 'text-[#4c4c4c]'}`}>EN</button>
                        </div>
                    </div>

                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "block px-3 py-3 rounded-md text-base font-bold uppercase tracking-wide",
                                    link.primary
                                        ? "bg-[#e31e24] text-white"
                                        : "text-[#4c4c4c] hover:bg-tan/20"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}
